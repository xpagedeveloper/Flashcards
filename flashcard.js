        class FlashcardApp {
      constructor({ width, height, font, frontColor, backColor }) {
        this.style = { width, height, font, frontColor, backColor };
        this.pages = [];
        this.currentIndex = 0;
      }

      addPage(frontText, backText) {
        this.pages.push({ front: frontText, back: backText });
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
        card.style.fontFamily = this.style.font;

        const front = document.createElement('div');
        front.className = 'card-face card-front';
        front.style.backgroundColor = this.style.frontColor;

        const back = document.createElement('div');
        back.className = 'card-face card-back';
        back.style.backgroundColor = this.style.backColor;

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
          const data = this.pages[this.currentIndex];
          front.textContent = data.front;
          back.textContent = data.back;
        };

        document.getElementById('prevBtn').onclick = () => {
          if (this.currentIndex > 0) {
            this.currentIndex--;
            card.classList.remove('flip');
            renderCard();
          }
        };

        document.getElementById('nextBtn').onclick = () => {
          if (this.currentIndex < this.pages.length - 1) {
            this.currentIndex++;
            card.classList.remove('flip');
            renderCard();
          }
        };

        renderCard();
      }
    }
