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

  const ANIMATION_CLASSES = [
    'slide-left-out',
    'slide-left-in',
    'slide-right-out',
    'slide-right-in'
  ];

  class FlashcardApp {
    constructor(options = {}) {
      this.style = { ...DEFAULT_STYLE, ...options };
      this.pages = [];
      this.currentIndex = 0;
      this._keydownHandler = null;
      this._isTransitioning = false;
      this._elements = null;
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

      const nav = document.createElement('div');
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
        const mergedStyle = {
          ...this.style,
          ...config,
          frontColor: config.frontColor ?? config.backgroundColor ?? this.style.frontColor,
          backColor: config.backColor ?? config.backgroundColor ?? this.style.backColor,
          textColor: config.textColor ?? this.style.textColor
        };

        card.classList.remove('flip');
        front.textContent = frontText;
        back.textContent = backText;
        applyCardStyle(mergedStyle);
      };

      const updateNavigationState = () => {
        prevBtn.disabled = this.currentIndex === 0;
        nextBtn.disabled = this.currentIndex === this.pages.length - 1;
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

        const outClass = direction === 'left' ? 'slide-left-out' : 'slide-right-out';
        const inClass = direction === 'left' ? 'slide-left-in' : 'slide-right-in';

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
        transitionToCard(this.currentIndex - 1, 'right');
      };

      const goToNext = () => {
        transitionToCard(this.currentIndex + 1, 'left');
      };

      prevBtn.addEventListener('click', goToPrevious);
      nextBtn.addEventListener('click', goToNext);

      card.addEventListener('click', () => {
        if (this._isTransitioning) {
          return;
        }

        card.classList.toggle('flip');
      });

      const keydownHandler = (event) => {
        if (event.key === 'ArrowRight') {
          goToNext();
        }

        if (event.key === 'ArrowLeft') {
          goToPrevious();
        }
      };

      document.addEventListener('keydown', keydownHandler);

      this._keydownHandler = keydownHandler;
      this._elements = {
        container,
        card,
        front,
        back,
        prevBtn,
        nextBtn
      };

      renderCard();
      updateNavigationState();

      return this;
    }
  }

  return { FlashcardApp };
});
