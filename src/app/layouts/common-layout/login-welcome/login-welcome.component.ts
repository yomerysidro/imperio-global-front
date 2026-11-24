import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';

@Component({
  selector: 'app-login-welcome',
  standalone: true,
  templateUrl: './login-welcome.component.html',
  styleUrl: './login-welcome.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginWelcomeComponent {
  private readonly dialogRef = inject(DialogRef);
  private readonly destroyRef = inject(DestroyRef);
  closing = false;

  close(): void {
    if (this.closing) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.dialogRef.close();
      return;
    }

    this.closing = true;
    timer(160).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.dialogRef.close());
  }
}
