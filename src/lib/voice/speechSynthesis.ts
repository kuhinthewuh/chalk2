export class SpeechSynthesisWrapper {
  private synth: SpeechSynthesis | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis;
    }
  }

  public speak(text: string) {
    if (!this.synth || this.isMuted) return;

    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find a normal English voice
    const voices = this.synth.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en-') && !v.name.toLowerCase().includes('zira'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    this.synth.speak(utterance);
  }

  public cancel() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.cancel();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}

export const speechSynthesizer = new SpeechSynthesisWrapper();
