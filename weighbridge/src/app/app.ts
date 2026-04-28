import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('weighbridge');

  constructor() {
    // Capture phase: prevent browser from incrementing type=number on ArrowUp/Down before any handler runs.
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') &&
          e.target instanceof HTMLInputElement && e.target.type === 'number') {
        e.preventDefault();
      }
    }, true);
  }
}
