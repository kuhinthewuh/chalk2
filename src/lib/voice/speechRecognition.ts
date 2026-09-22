export class SpeechRecognitionWrapper {
  private recognition: SpeechRecognition | null = null;
  private onResultCallback?: (transcript: string) => void;
  private onErrorCallback?: (err: string) => void;
  private onEndCallback?: () => void;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
          if (event.results.length > 0) {
            const transcript = event.results[0][0].transcript;
            this.onResultCallback?.(transcript);
          }
        };

        this.recognition.onerror = (event) => {
          this.onErrorCallback?.(event.error);
        };

        this.recognition.onend = () => {
          this.onEndCallback?.();
        };
      }
    }
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }

  public start(
    onResult: (t: string) => void,
    onError: (e: string) => void,
    onEnd: () => void
  ) {
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onEndCallback = onEnd;

    try {
      this.recognition?.start();
    } catch (e) {
      console.warn("Speech recognition failed to start", e);
      onError("failed-to-start");
    }
  }

  public stop() {
    this.recognition?.stop();
  }
}

export const speechRecognizer = new SpeechRecognitionWrapper();
