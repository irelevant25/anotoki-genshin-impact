import { Component, ContentChildren, QueryList, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StepperStepComponent } from './stepper-step/stepper-step.component';
import { ButtonComponent } from '../button/button.component';
import { AbstractRolesComponent } from '../../abstract-roles.class';

export interface StepConfig {
  id?: string;
  title?: string;
  nextStepId?: string;
  previousStepId?: string;
  nextStep?: StepConfig;
  previousStep?: StepConfig;
  nextButton: boolean;
  backButton: boolean;
  completeButton: boolean;
  completed: boolean;
  component: StepperStepComponent;
}

@Component({
  selector: 'app-stepper',
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss'],
})
export class StepperComponent extends AbstractRolesComponent {
  @ContentChildren(StepperStepComponent) stepComponents?: QueryList<StepperStepComponent>;

  initialStepId = model<string>();
  isValid = model<boolean>(true);
  width = model<string>('100%');
  step = model<StepConfig>();
  containerClass = model<string>();
  contentClass = model<string>();

  completeClick = output();
  backClick = output<StepConfig | undefined>();
  nextClick = output<StepConfig | undefined>();

  steps: StepConfig[] = [];

  ngAfterContentInit(): void {
    this.buildStepsConfiguration();
    this.initializeCurrentStep();
  }

  private buildStepsConfiguration(): void {
    const stepComponentsArray = this.stepComponents?.toArray() ?? [];

    this.steps = stepComponentsArray.map((component, index) => {
      const isFirst = index === 0;
      const isLast = index === stepComponentsArray.length - 1;

      // Auto-determine next and previous step IDs if not provided
      const nextStepId = component.nextStepId() || (!isLast ? stepComponentsArray[index + 1].id() : undefined);
      const previousStepId = component.previousStepId() || (!isFirst ? stepComponentsArray[index - 1].id() : undefined);

      // Auto-determine button visibility if not explicitly set
      const nextButton = component.nextButton() !== undefined ? !!component.nextButton() : !isLast;
      const backButton = component.backButton() !== undefined ? !!component.backButton() : !isFirst;
      const completeButton = component.completeButton() !== undefined ? !!component.completeButton() : isLast;

      return {
        id: component.id(),
        title: component.title(),
        nextStepId,
        previousStepId,
        nextButton,
        backButton,
        completeButton,
        completed: false,
        component,
      } satisfies StepConfig;
    });

    this.steps.forEach((step) => {
      step.nextStep = this.steps.find((s) => s.id === step.nextStepId);
      step.previousStep = this.steps.find((s) => s.id === step.previousStepId);
    });
  }

  private initializeCurrentStep(): void {
    if (this.steps.length > 0) {
      this.step.set(this.steps.find((step) => step.id === this.initialStepId()) ?? this.steps[0]);
    }
  }

  isLastStep(): boolean {
    const currentIndex = this.steps.findIndex((step) => step.id === this.step()?.id);
    return currentIndex === this.steps.length - 1;
  }

  goNext(): void {
    this.nextClick.emit(this.step());
    const step = this.step();
    if (step?.nextStepId) {
      if (this.isValid()) {
        step.completed = true;
        this.step.set(step.nextStep);
      }
    }
  }

  goBack(): void {
    this.backClick.emit(this.step());
    const step = this.step();
    if (step?.previousStepId) {
      this.step.set(step.previousStep);
    }
  }

  complete(): void {
    this.completeClick.emit();
    const step = this.step();
    if (step) {
      if (this.isValid()) {
        step.completed = true;
      }
    }
  }
}
