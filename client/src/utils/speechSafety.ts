export class SpeechSafetyMonitor {
  private recognition: any = null;
  private isRunning: boolean = false;
  private onTranscriptCallback: ((text: string) => void) | null = null;

  constructor() {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      try {
        this.recognition = new SpeechRecognitionClass();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
          const lastResultIndex = event.results.length - 1;
          const transcript = event.results[lastResultIndex][0].transcript;
          if (transcript && this.onTranscriptCallback) {
            this.onTranscriptCallback(transcript);
          }
        };

        this.recognition.onerror = (err: any) => {
          if (err.error !== 'no-speech') {
            console.debug('[SpeechSafety] Recognition notice:', err.error);
          }
        };

        this.recognition.onend = () => {
          if (this.isRunning) {
            setTimeout(() => {
              if (this.isRunning) {
                try {
                  this.recognition.start();
                } catch {}
              }
            }, 1000);
          }
        };
      } catch (err) {
        console.debug('[SpeechSafety] Speech recognition not supported in this browser.', err);
      }
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public start(callback: (text: string) => void): boolean {
    if (!this.recognition || this.isRunning) return false;
    this.onTranscriptCallback = callback;
    this.isRunning = true;
    try {
      this.recognition.start();
      console.log('[SpeechSafety] Live safety speech moderation active (with user consent).');
      return true;
    } catch {
      return false;
    }
  }

  public stop(): void {
    this.isRunning = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
  }
}

export const speechSafety = new SpeechSafetyMonitor();
