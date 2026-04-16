import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Pone en mayúscula la primera letra del valor mientras el usuario escribe.
 * No aplicar a contraseñas, email, fechas, etc. (se ignoran por `type`).
 */
@Directive({
  selector: 'input[appCapitalizeFirst]',
  standalone: true,
})
export class CapitalizeFirstDirective {
  private readonly el = inject(ElementRef<HTMLInputElement>);
  private readonly control = inject(NgControl, { optional: true, self: true });

  @HostListener('input')
  onInput(): void {
    const input = this.el.nativeElement;
    if (this.shouldSkip(input)) {
      return;
    }

    const v = input.value;
    if (v.length === 0) {
      return;
    }

    const newV = v.charAt(0).toLocaleUpperCase('es') + v.slice(1);
    if (newV === v) {
      return;
    }

    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;

    if (this.control?.control) {
      this.control.control.setValue(newV, { emitEvent: true });
    } else {
      input.value = newV;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    requestAnimationFrame(() => {
      try {
        const len = newV.length;
        input.setSelectionRange(Math.min(start, len), Math.min(end, len));
      } catch {
        /* ignore */
      }
    });
  }

  private shouldSkip(input: HTMLInputElement): boolean {
    const t = (input.type || 'text').toLowerCase();
    return (
      t === 'password' ||
      t === 'email' ||
      t === 'hidden' ||
      t === 'checkbox' ||
      t === 'radio' ||
      t === 'date' ||
      t === 'datetime-local' ||
      t === 'time' ||
      t === 'number' ||
      t === 'color' ||
      t === 'range' ||
      t === 'file' ||
      t === 'url'
    );
  }
}
