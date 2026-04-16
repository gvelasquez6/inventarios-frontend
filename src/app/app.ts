import { ApplicationRef, Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationStart,
  Router,
  RouterModule,
  RouterOutlet,
} from '@angular/router';
import { ProgressSpinner } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, ToastModule, ProgressSpinner],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly appRef = inject(ApplicationRef);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly title = signal('inventarios-frontend');
  protected readonly navLoading = signal(false);

  /** Tiempo mínimo que permanece visible el overlay (navegaciones muy rápidas incluidas). */
  private readonly minSpinnerMs = 1000;
  private loadingShownAt = 0;
  private hideSpinnerHandle: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }
      if (event instanceof NavigationStart) {
        if (this.hideSpinnerHandle !== null) {
          clearTimeout(this.hideSpinnerHandle);
          this.hideSpinnerHandle = null;
        }
        this.setNavLoading(true);
        this.loadingShownAt = performance.now();
        return;
      }
      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError ||
        event instanceof NavigationSkipped
      ) {
        const elapsed = performance.now() - this.loadingShownAt;
        const wait = Math.max(0, this.minSpinnerMs - elapsed);
        if (this.hideSpinnerHandle !== null) {
          clearTimeout(this.hideSpinnerHandle);
        }
        this.hideSpinnerHandle = setTimeout(() => {
          this.setNavLoading(false);
          this.hideSpinnerHandle = null;
        }, wait);
      }
    });
  }

  /**
   * Con `provideZonelessChangeDetection` implícito, los eventos del router no disparan repintado;
   * sin `tick()` el overlay con señales no llega a pintarse.
   */
  private setNavLoading(value: boolean): void {
    this.navLoading.set(value);
    this.appRef.tick();
  }
}