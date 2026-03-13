import { Component, model, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-stepper-step',
  imports: [FormsModule],
  templateUrl: './stepper-step.component.html',
  styleUrls: ['./stepper-step.component.scss'],
})
export class StepperStepComponent {
  id = model<string | undefined>(Math.random().toString(36).substr(2, 9));
  title = model<string | undefined>(undefined);
  nextStepId = model<string | undefined>(undefined);
  previousStepId = model<string | undefined>(undefined);
  nextButton = model<boolean | undefined>(undefined);
  backButton = model<boolean | undefined>(undefined);
  completeButton = model<boolean | undefined>(undefined);

  @ViewChild('stepTemplate', { static: true }) template?: TemplateRef<any>;

  ngAfterViewInit(): void {
    if (!this.id) {
      console.warn('StepperStepComponent: id is required');
    }
    if (!this.title) {
      console.warn('StepperStepComponent: label is required');
    }
  }
}
