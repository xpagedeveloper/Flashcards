(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const exports = factory();
    root.FlashcardLib = exports;
    root.FlashcardApp = exports.FlashcardApp;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function () {
  const DEFAULT_STYLE = {
    width: '300px',
    height: '200px',
    font: "'Inter', 'Segoe UI', Arial, sans-serif",
    frontColor: '#ffffff',
    backColor: '#ffebcd',
    textColor: '#333333'
  };

  const VALID_DIRECTIONS = new Set(['left', 'right', 'up', 'down']);

  const ANIMATION_CLASSES = [
    'slide-left-out',
    'slide-left-in',
    'slide-right-out',
    'slide-right-in',
    'slide-up-out',
    'slide-up-in',
    'slide-down-out',
    'slide-down-in'
  ];

  const DIRECTION_CLASS_MAP = {
    left: {
      out: 'slide-left-out',
      in: 'slide-left-in'
    },
    right: {
      out: 'slide-right-out',
      in: 'slide-right-in'
    },
    up: {
      out: 'slide-up-out',
      in: 'slide-up-in'
    },
    down: {
      out: 'slide-down-out',
      in: 'slide-down-in'
    }
  };

  const OPPOSITE_DIRECTION = {
    left: 'right',
    right: 'left',
    up: 'down',
    down: 'up'
  };

  const VALID_NAVIGATION_MODES = new Set(['buttons', 'side-arrows', 'vertical-arrows', 'none']);

  const NAVIGATION_MODE_ALIASES = {
    buttons: 'buttons',
    button: 'buttons',
    btns: 'buttons',
    controls: 'buttons',
    'side-arrows': 'side-arrows',
    side: 'side-arrows',
    horizontal: 'side-arrows',
    'horizontal-arrows': 'side-arrows',
    'left-right': 'side-arrows',
    arrows: 'side-arrows',
    'vertical-arrows': 'vertical-arrows',
    vertical: 'vertical-arrows',
    'top-bottom': 'vertical-arrows',
    'bottom-top': 'vertical-arrows',
    'up-down': 'vertical-arrows',
    'down-up': 'vertical-arrows',
    none: 'none',
    hidden: 'none',
    off: 'none'
  };

  const normalizeDirection = (direction, fallback = 'left') => {
    if (typeof direction !== 'string') {
      return fallback;
    }

    const trimmed = direction.trim().toLowerCase();
    return VALID_DIRECTIONS.has(trimmed) ? trimmed : fallback;
  };

  const normalizeNavigationMode = (mode, fallback = 'buttons') => {
    if (typeof mode !== 'string') {
      return fallback;
    }

    const trimmed = mode.trim().toLowerCase();
    const normalized = NAVIGATION_MODE_ALIASES[trimmed] || trimmed;
    return VALID_NAVIGATION_MODES.has(normalized) ? normalized : fallback;
  };

  class FlashcardApp {
    constructor(options = {}) {
      const {
        navigationMode = 'buttons',
        slideDirection = 'left',
        ...styleOverrides
      } = options;

      this.style = { ...DEFAULT_STYLE, ...styleOverrides };
      this.navigationMode = normalizeNavigationMode(navigationMode);
      this._preferredNavigationMode = this.navigationMode;
      this.slideDirection = normalizeDirection(slideDirection);
      this.pages = [];
      this.currentIndex = 0;
      this._keydownHandler = null;
      this._isTransitioning = false;
      this._elements = null;
      this._applyNavigationMode = null;
      this._updateNavigationState = null;
    }

    addPage(frontText, backText, config = {}) {
      if (typeof frontText !== 'string' || typeof backText !== 'string') {
        throw new TypeError('Flashcard pages require string values for both the front and the back text.');
      }

      this.pages.push({
        front: frontText,
        back: backText,
        config: { ...config }
      });

      return this;
    }

    clearPages() {
      this.pages = [];
      this.currentIndex = 0;
      return this;
    }

    destroy() {
      if (typeof document !== 'undefined' && this._keydownHandler) {
        document.removeEventListener('keydown', this._keydownHandler);
      }

      this._keydownHandler = null;
      this._elements = null;
      this._isTransitioning = false;
      this._applyNavigationMode = null;
      this._updateNavigationState = null;
      return this;
    }

    setNavigationMode(mode, options = {}) {
      const { persist = true } = options;
      const normalized = normalizeNavigationMode(mode, this.navigationMode);

      if (persist) {
        this._preferredNavigationMode = normalized;
      }

      if (normalized !== this.navigationMode) {
        this.navigationMode = normalized;
      }

      if (this._applyNavigationMode) {
        this._applyNavigationMode(this.navigationMode);
      }

      if (this._updateNavigationState) {
        this._updateNavigationState();
      }

      return this;
    }

    start(containerOrId = 'flashcardApp') {
      if (typeof document === 'undefined') {
        throw new Error('FlashcardApp requires a browser environment with a DOM to render.');
      }

      if (this.pages.length === 0) {
        throw new Error('No flashcard pages have been added. Use addPage before calling start.');
      }

      const container =
        typeof containerOrId === 'string'
          ? document.getElementById(containerOrId)
          : containerOrId;

      if (!container) {
        throw new Error('Unable to locate the container element for the flashcard application.');
      }

      this.destroy();

      container.innerHTML = '';

      const cardContainer = document.createElement('div');
      cardContainer.className = 'flashcard-container';

      const card = document.createElement('div');
      card.className = 'flashcard';

      const front = document.createElement('div');
      front.className = 'card-face card-front';

      const back = document.createElement('div');
      back.className = 'card-face card-back';

      card.appendChild(front);
      card.appendChild(back);
      cardContainer.appendChild(card);
      container.appendChild(cardContainer);

      let prevControl = null;
      let nextControl = null;
      let nav = null;

      this._elements = {
        container,
        card,
        front,
        back,
        prevControl: null,
        nextControl: null,
        nav: null
      };

      const detachControls = () => {
        if (prevControl) {
          prevControl.removeEventListener('click', goToPrevious);
          if (prevControl.parentNode) {
            prevControl.parentNode.removeChild(prevControl);
          }
        }

        if (nextControl) {
          nextControl.removeEventListener('click', goToNext);
          if (nextControl.parentNode) {
            nextControl.parentNode.removeChild(nextControl);
          }
        }

        if (nav && nav.parentNode) {
          nav.parentNode.removeChild(nav);
        }

        prevControl = null;
        nextControl = null;
        nav = null;
      };

      const rebuildNavigation = (mode) => {
        const normalized = normalizeNavigationMode(mode, this.navigationMode);

        detachControls();

        ['navigation-buttons', 'navigation-side-arrows', 'navigation-vertical-arrows', 'navigation-none'].forEach(className =>
          cardContainer.classList.remove(className)
        );
        cardContainer.classList.add(`navigation-${normalized}`);

        if (normalized === 'buttons') {
          nav = document.createElement('div');
          nav.className = 'nav-buttons';

          const prevBtn = document.createElement('button');
          prevBtn.type = 'button';
          prevBtn.textContent = 'Previous';

          const nextBtn = document.createElement('button');
          nextBtn.type = 'button';
          nextBtn.textContent = 'Next';

          nav.appendChild(prevBtn);
          nav.appendChild(nextBtn);
          container.appendChild(nav);

          prevControl = prevBtn;
          nextControl = nextBtn;
        } else if (normalized !== 'none') {
          const createArrowButton = (className, label) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `flashcard-arrow ${className}`;
            button.innerHTML = label;
            return button;
          };

          if (normalized === 'side-arrows') {
            prevControl = createArrowButton('arrow-horizontal arrow-left', '&#10094;');
            prevControl.setAttribute('aria-label', 'Previous card');
            nextControl = createArrowButton('arrow-horizontal arrow-right', '&#10095;');
            nextControl.setAttribute('aria-label', 'Next card');
          } else if (normalized === 'vertical-arrows') {
            prevControl = createArrowButton('arrow-vertical arrow-top', '&#9650;');
            prevControl.setAttribute('aria-label', 'Previous card');
            nextControl = createArrowButton('arrow-vertical arrow-bottom', '&#9660;');
            nextControl.setAttribute('aria-label', 'Next card');
          }

          [prevControl, nextControl].forEach(control => {
            if (control) {
              cardContainer.appendChild(control);
            }
          });
        }

        [prevControl, nextControl].forEach(control => {
          if (control) {
            control.addEventListener('click', control === prevControl ? goToPrevious : goToNext);
          }
        });

        this._elements.prevControl = prevControl;
        this._elements.nextControl = nextControl;
        this._elements.nav = nav;
      };

      const resetAnimations = () => {
        ANIMATION_CLASSES.forEach(className => card.classList.remove(className));
      };

      const animateCard = (className, onComplete) => {
        if (!className) {
          onComplete();
          return;
        }

        let resolved = false;

        const finish = () => {
          if (resolved) {
            return;
          }
          resolved = true;
          card.classList.remove(className);
          onComplete();
        };

        const handleAnimationEnd = (event) => {
          if (event.target !== card) {
            return;
          }
          card.removeEventListener('animationend', handleAnimationEnd);
          if (typeof window !== 'undefined') {
            window.clearTimeout(fallbackTimer);
          }
          finish();
        };

        card.addEventListener('animationend', handleAnimationEnd);

        const fallbackTimer = typeof window !== 'undefined'
          ? window.setTimeout(() => {
              card.removeEventListener('animationend', handleAnimationEnd);
              finish();
            }, 400)
          : null;

        card.classList.add(className);
      };

      const applyCardStyle = (style) => {
        card.style.width = style.width;
        card.style.height = style.height;

        [front, back].forEach(element => {
          element.style.fontFamily = style.font;
          element.style.color = style.textColor;
        });

        front.style.backgroundColor = style.frontColor;
        back.style.backgroundColor = style.backColor;
      };

      const renderCard = () => {
        const { front: frontText, back: backText, config = {} } = this.pages[this.currentIndex];
        const { navigationMode: cardNavigationMode, ...cardStyleOverrides } = config;

        if (config && Object.prototype.hasOwnProperty.call(config, 'navigationMode')) {
          const desiredMode = normalizeNavigationMode(cardNavigationMode, this.navigationMode);
          if (desiredMode !== this.navigationMode) {
            this.setNavigationMode(desiredMode, { persist: false });
          }
        } else if (this.navigationMode !== this._preferredNavigationMode) {
          this.setNavigationMode(this._preferredNavigationMode, { persist: false });
        }

        const mergedStyle = {
          ...this.style,
          ...cardStyleOverrides,
          frontColor:
            cardStyleOverrides.frontColor ??
            cardStyleOverrides.backgroundColor ??
            this.style.frontColor,
          backColor:
            cardStyleOverrides.backColor ??
            cardStyleOverrides.backgroundColor ??
            this.style.backColor,
          textColor: cardStyleOverrides.textColor ?? this.style.textColor
        };

        card.classList.remove('flip');
        front.textContent = frontText;
        back.textContent = backText;
        applyCardStyle(mergedStyle);
      };

      const updateNavigationState = () => {
        const atStart = this.currentIndex === 0;
        const atEnd = this.currentIndex === this.pages.length - 1;

        const updateControl = (control, disabled) => {
          if (!control) {
            return;
          }

          control.disabled = disabled;
          control.setAttribute('aria-disabled', disabled ? 'true' : 'false');
        };

        updateControl(prevControl, atStart);
        updateControl(nextControl, atEnd);
      };

      const transitionToCard = (newIndex, direction = 'left') => {
        if (newIndex === this.currentIndex || newIndex < 0 || newIndex >= this.pages.length) {
          return;
        }

        if (this._isTransitioning) {
          return;
        }

        this._isTransitioning = true;
        resetAnimations();
        card.classList.remove('flip');

        const normalizedDirection = normalizeDirection(direction, 'left');
        const { out: outClass, in: inClass } = DIRECTION_CLASS_MAP[normalizedDirection];

        animateCard(outClass, () => {
          this.currentIndex = newIndex;
          renderCard();
          resetAnimations();

          animateCard(inClass, () => {
            resetAnimations();
            this._isTransitioning = false;
            updateNavigationState();
          });
        });
      };

      const goToPrevious = () => {
        const direction = normalizeDirection(OPPOSITE_DIRECTION[this.slideDirection] || 'right', 'right');
        transitionToCard(this.currentIndex - 1, direction);
      };

      const goToNext = () => {
        transitionToCard(this.currentIndex + 1, this.slideDirection);
      };

      card.addEventListener('click', () => {
        if (this._isTransitioning) {
          return;
        }

        card.classList.toggle('flip');
      });

      const keydownHandler = (event) => {
        const orientation = this.slideDirection === 'up' || this.slideDirection === 'down' ? 'vertical' : 'horizontal';

        if (event.key === 'ArrowRight' || (orientation === 'vertical' && event.key === 'ArrowDown')) {
          goToNext();
        }

        if (event.key === 'ArrowLeft' || (orientation === 'vertical' && event.key === 'ArrowUp')) {
          goToPrevious();
        }
      };

      document.addEventListener('keydown', keydownHandler);

      this._keydownHandler = keydownHandler;
      this._applyNavigationMode = rebuildNavigation;
      this._updateNavigationState = updateNavigationState;
      rebuildNavigation(this.navigationMode);
      renderCard();
      updateNavigationState();

      return this;
    }
  }

  return { FlashcardApp };
});
