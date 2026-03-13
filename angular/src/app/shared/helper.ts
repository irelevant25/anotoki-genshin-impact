const CHARACTERS: any[] = [];

export interface IImageEffect {
  effectClip: (clipOrientations?: string[], clipWidths?: number[], invert?: boolean) => IImageEffect;
  effectGrayscale: (amount?: number) => IImageEffect;
  effectBlur: (px?: number) => IImageEffect;
  effectPixelate: (pixelSize?: number) => IImageEffect;
  draw: (canvas: HTMLCanvasElement, imgUrl: string) => void;
}

export const HELPER = {
  /**
   * Gets a random integer between min and max (inclusive)
   *
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random integer
   */
  getRandomInt(min: number, max: number): number {
    return Math.round(Math.random() * (max - min) + min);
  },

  /**
 * Shuffles array elements randomly
 *
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
  shuffleArray(array: any[]): any[] {
    return [...array].sort(() => Math.random() - 0.5);
  },

  /**
 * Gets a random character from the given array or from the full list of characters
 * if no filter is provided.
 *
 * @param {Function} [filterFn] - Optional filter function to filter the characters
 * @returns {Object} A random character object from the filtered array
 * @throws {Error} If no characters match the filter criteria
 */
  getRandomCharacter(filterFn?: any): any {
    // Determine which array to choose from
    const pool = typeof filterFn === 'function' ? (CHARACTERS).filter(filterFn) : CHARACTERS;

    // Handle the case where no items match the filter
    if (pool.length === 0) {
      throw new Error('No characters found matching the filter criteria.');
    }

    // Return a random element from the chosen pool
    return pool[this.getRandomInt(0, pool.length - 1)];
  },

  /**
   * Gets a specified number of random characters from the full list of characters.
   *
   * @param {number} count - The number of characters to return
   * @returns {Array} An array of random character objects
   */
  getRandomCharacters(count: number): any[] {
    return this.shuffleArray(CHARACTERS).slice(0, count);
  },

  /**
 * Returns today's date as a string in the format 'YYYY-MM-DD'.
 *
 * @returns {string} Today's date as a string in the format 'YYYY-MM-DD'.
 */
  getTodayString(): string {
    return new Date().toJSON().slice(0, 10);
  },

  ImageEffects(): IImageEffect {
    interface Filters {
      grayscale?: string;
      blur?: string;
      pixelate?: number;
    }

    type EffectCallback = (params: { ctx: CanvasRenderingContext2D; canvas: HTMLCanvasElement; filters: Filters }) => void;

    const effects: EffectCallback[] = [];

    function effectClip(clipOrientations = ['left'], clipWidths = [0.5], invert = false): IImageEffect {
      effects.push(({ ctx, canvas }) => {
        const w = canvas.width;
        const h = canvas.height;

        ctx.beginPath();

        if (invert) {
          // Calculate the bottom-right corner region
          const leftWidth = clipWidths[clipOrientations.indexOf('left')] || 0;
          const topHeight = clipWidths[clipOrientations.indexOf('top')] || 0;

          const bottomRightX = w * leftWidth;
          const bottomRightY = h * topHeight;

          // Clip to the bottom-right corner
          ctx.rect(bottomRightX, bottomRightY, w - bottomRightX, h - bottomRightY);
        } else {
          // Original logic for non-inverted case
          for (let i = 0; i < clipOrientations.length; i++) {
            const o = clipOrientations[i];
            const width = clipWidths[i];

            const clipX = w * width;
            const clipY = h * width;

            if (o === 'left') ctx.rect(0, 0, clipX, h);
            if (o === 'right') ctx.rect(clipX, 0, w - clipX, h);
            if (o === 'top') ctx.rect(0, 0, w, clipY);
            if (o === 'bottom') ctx.rect(0, clipY, w, h - clipY);
          }
        }

        ctx.clip();
      });

      return api;
    }

    function effectGrayscale(amount = 1) {
      effects.push(({ ctx, filters }) => {
        filters.grayscale = `grayscale(${amount})`;
      });
      return api;
    }

    function effectBlur(px = 2.5) {
      effects.push(({ filters }) => {
        filters.blur = `blur(${px}px)`;
      });
      return api;
    }

    function effectPixelate(pixelSize = 8) {
      effects.push(({ filters }) => {
        filters.pixelate = pixelSize;
      });
      return api;
    }

    function draw(canvas: HTMLCanvasElement, imgUrl: string) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imgUrl;

      img.onload = function () {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error('Failed to get 2D context');
          return;
        }
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const w = canvas.width;
        const h = canvas.height;

        const filters: Filters = {};

        ctx.save();
        effects.forEach((effect) => effect({ ctx, canvas, filters }));

        // Create pixelated source if needed
        let source: HTMLImageElement | HTMLCanvasElement = img;
        if (filters.pixelate) {
          const pixelSize = filters.pixelate;
          const pw = Math.max(1, Math.floor(w / pixelSize));
          const ph = Math.max(1, Math.floor(h / pixelSize));
          const lowRes = document.createElement('canvas');
          lowRes.width = pw;
          lowRes.height = ph;
          const lowResCtx = lowRes.getContext('2d');
          if (!lowResCtx) return;
          lowResCtx.drawImage(img, 0, 0, pw, ph);
          const pixelated = document.createElement('canvas');
          pixelated.width = w;
          pixelated.height = h;
          const pixelatedCtx = pixelated.getContext('2d');
          if (!pixelatedCtx) return;
          pixelatedCtx.imageSmoothingEnabled = false;
          pixelatedCtx.drawImage(lowRes, 0, 0, w, h);
          source = pixelated;
          delete filters.pixelate;
        }

        const filterString = Object.values(filters).join(' ') || 'none';

        if (filters.blur) {
          // Draw with all filters (including blur) to an offscreen canvas
          const offscreen = document.createElement('canvas');
          offscreen.width = w;
          offscreen.height = h;
          const offCtx = offscreen.getContext('2d');
          if (!offCtx) {
            console.error('Failed to create offscreen canvas context');
            return;
          }
          offCtx.filter = filterString;
          offCtx.drawImage(source, 0, 0, w, h);
          const blurData = offCtx.getImageData(0, 0, w, h);

          // Draw unfiltered to get the original alpha channel
          const alphaOffscreen = document.createElement('canvas');
          alphaOffscreen.width = w;
          alphaOffscreen.height = h;

          const alphaContext = alphaOffscreen.getContext('2d');
          if (!alphaContext) {
            console.error('Failed to create alpha canvas context');
            return;
          }
          alphaContext.drawImage(source, 0, 0, w, h);
          const origAlpha = alphaContext.getImageData(0, 0, w, h).data;

          // Replace blurred alpha with original to remove edge fade
          for (let i = 3; i < blurData.data.length; i += 4) {
            blurData.data[i] = origAlpha[i];
          }
          offCtx.putImageData(blurData, 0, 0);

          // Draw result to main canvas — clip is still active
          ctx.drawImage(offscreen, 0, 0);
        } else {
          ctx.filter = filterString;
          ctx.drawImage(source, 0, 0, w, h);
        }

        ctx.restore();
      };
    }

    const api = {
      effectClip,
      effectGrayscale,
      effectBlur,
      effectPixelate,
      draw,
    };

    return api;
  }
}