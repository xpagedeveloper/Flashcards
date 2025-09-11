 class FlashcardPageConfig {
      constructor({ font, textColor, backgroundColor }) {
        this.font = font;
        this.textColor = textColor;
        this.backgroundColor = backgroundColor;
      }
    }

    class FlashcardApp {
      constructor({ width, height, font, frontColor, backColor, textColor }) {
        this.style = { width, height, font, frontColor, backColor, textColor };
        this.pages = [];
        this.currentIndex = 0;
      }

      addPage(frontText, backText, config = null) {
        this.pages.push({ front: frontText, back: backText, config });
      }

      start(containerId = 'flashcardApp') {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        const cardContainer = document.createElement('div');
        cardContainer.className = 'flashcard-container';

        const card = document.createElement('div');
        card.className = 'flashcard';
        card.style.width = this.style.width;
        card.style.height = this.style.height;

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
        nav.innerHTML = `
          <button id="prevBtn">Föregående</button>
          <button id="nextBtn">Nästa</button>
        `;
        container.appendChild(nav);

        card.addEventListener('click', () => {
          card.classList.toggle('flip');
        });

        const renderCard = () => {
          const { front: frontText, back: backText, config } = this.pages[this.currentIndex];

          const effectiveFont = config?.font || this.style.font;
          const effectiveFrontBg = config?.backgroundColor || this.style.frontColor;
          const effectiveBackBg = config?.backgroundColor || this.style.backColor;
          const effectiveTextColor = config?.textColor || this.style.textColor;

          front.textContent = frontText;
          back.textContent = backText;

          [front, back].forEach(el => {
            el.style.fontFamily = effectiveFont;
            el.style.color = effectiveTextColor;
          });

          front.style.backgroundColor = effectiveFrontBg;
          back.style.backgroundColor = effectiveBackBg;
        };

        const transitionToCard = (newIndex, direction = 'left') => {
          card.classList.remove('flip');
          const outClass = direction === 'left' ? 'slide-left-out' : 'slide-right-out';
          const inClass = direction === 'left' ? 'slide-left-in' : 'slide-right-in';

          card.classList.add(outClass);

          card.addEventListener('animationend', () => {
            this.currentIndex = newIndex;
            renderCard();
            card.classList.remove(outClass);
            card.classList.add(inClass);

            card.addEventListener('animationend', () => {
              card.classList.remove(inClass);
            }, { once: true });

          }, { once: true });
        };

        document.getElementById('prevBtn').onclick = () => {
          if (this.currentIndex > 0) {
            transitionToCard(this.currentIndex - 1, 'right');
          }
        };

        document.getElementById('nextBtn').onclick = () => {
          if (this.currentIndex < this.pages.length - 1) {
            transitionToCard(this.currentIndex + 1, 'left');
          }
        };

        document.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight' && this.currentIndex < this.pages.length - 1) {
            transitionToCard(this.currentIndex + 1, 'left');
          }
          if (e.key === 'ArrowLeft' && this.currentIndex > 0) {
            transitionToCard(this.currentIndex - 1, 'right');
          }
        });

        renderCard();
      }
    }
