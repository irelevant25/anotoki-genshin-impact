import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AbstractInputComponent } from '../../abstract-input.class';

type Type = string;

@Component({
  selector: 'app-password',
  imports: [FormsModule],
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.scss'],
  providers: [
    {
      provide: AbstractInputComponent,
      useExisting: PasswordComponent,
    },
  ],
})
export class PasswordComponent extends AbstractInputComponent<Type> {
  showToggle = model<boolean>(true);
  isPasswordVisible = model<boolean>(false);

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newValue = target.value;
    this.value.set(newValue);
    this.inputChange.emit(newValue);
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible.update((visible) => !visible);
  }
}
