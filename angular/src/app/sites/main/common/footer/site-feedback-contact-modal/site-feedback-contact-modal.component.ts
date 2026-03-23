import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../../../shared/local-lib/components/modal/modal.component';
import { AbstractModalComponent } from '../../../../../shared/local-lib/abstract-modal.class';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { TextareaComponent } from '../../../../../shared/local-lib/components/textarea/textarea.component';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { ButtonComponent } from "../../../../../shared/local-lib/components/button/button.component";

type FeedbackType = 'Bug' | 'Suggestion' | 'Other';

@Component({
  selector: 'app-site-feedback-contact-modal',
  templateUrl: './site-feedback-contact-modal.component.html',
  styleUrls: ['./site-feedback-contact-modal.component.scss'],
  imports: [ModalComponent, ReactiveFormsModule, TextComponent, TextareaComponent, DropdownComponent, ButtonComponent],
  providers: [],
})
export class SiteFeedbackContactModalComponent extends AbstractModalComponent {
  feedbackForm: FormGroup;
  feedbackType: FeedbackType = 'Bug';

  sections = [
    'Daily',
    'Quiz - Banners',
    'Quiz - Pixelate',
    'Quiz - Mismatch',
    'Quiz - Music',
    'Quiz - Dish',
    'Quiz - Voice',
    'Difficulties',
    'Database',
    "What's New",
    'Backgrounds',
    'Versions',
    'Other',
  ];

  constructor(private fb: FormBuilder) {
    super();
    this.feedbackForm = this.createForm();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      type: ['Bug', Validators.required],
      email: [''],
      section: ['', Validators.required],
      title: ['', Validators.required],
      stepsToReproduce: [''],
      expectedBehavior: [''],
      actualBehavior: [''],
      browserDeviceInfo: [''],
      details: [''],
      whyImportant: [''],
      message: [''],
      additionalInfo: [''],
    });
  }

  onTypeChange(type: string | number | boolean | undefined | null): void {
    this.feedbackType = type as FeedbackType;
    this.feedbackForm.patchValue({ type });
  }

  onSubmit(): void {
    if (this.feedbackForm.valid) {
      const formData = this.feedbackForm.value;
      console.log('Feedback submitted:', formData);
      // TODO: Implement actual submission logic (e.g., send to backend)
      this.closeModal(true);
    }
  }

  onCancel(): void {
    this.closeModal(false);
  }
}
