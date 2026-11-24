import { Dialog } from '@angular/cdk/dialog';
import { OverlayContainer } from '@angular/cdk/overlay';
import { TestBed } from '@angular/core/testing';
import { LoginWelcomeComponent } from './login-welcome.component';

describe('Modal de bienvenida', () => {
  it('has an accessible title and keyboard dismissal, and fits a narrow container', async () => {
    const dialog = TestBed.inject(Dialog);
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const matchMedia = window.matchMedia.bind(window);
    spyOn(window, 'matchMedia').and.callFake(query => query === '(prefers-reduced-motion: reduce)'
      ? { matches: true } as MediaQueryList
      : matchMedia(query));

    try {
      const ref = dialog.open(LoginWelcomeComponent, {
        width: '288px',
        disableClose: true,
        autoFocus: '.welcome-action',
        ariaLabelledBy: 'login-welcome-title'
      });
      const closed = new Promise<void>(resolve => ref.closed.subscribe(() => resolve()));
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

      const container = overlay.querySelector<HTMLElement>('[role="dialog"]');
      const card = container.querySelector<HTMLElement>('.welcome-card');
      const button = card.querySelector<HTMLButtonElement>('.welcome-action');
      expect(container.getAttribute('aria-labelledby')).toBe('login-welcome-title');
      expect(card.querySelector('img').getAttribute('src')).toBe('favicon.ico');
      expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
      expect(card.offsetWidth).toBe(288);
      expect(button.textContent.trim()).toBe('¡Comenzar mi experiencia!');
      expect(document.activeElement).toBe(button);
      button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await closed;
      expect(document.activeElement).toBe(trigger);
    } finally {
      trigger.remove();
    }
  });
});
