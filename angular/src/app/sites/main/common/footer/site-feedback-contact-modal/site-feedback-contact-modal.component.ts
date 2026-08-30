import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ModalComponent } from '../../../../../shared/local-lib/components/modal/modal.component';
import { AbstractModalComponent } from '../../../../../shared/local-lib/abstract-modal.class';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { TextareaComponent } from '../../../../../shared/local-lib/components/textarea/textarea.component';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { ButtonComponent } from "../../../../../shared/local-lib/components/button/button.component";
import { CheckboxComponent } from '../../../../../shared/local-lib/components/checkbox/checkbox.component';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';
import { TranslationService } from '../../../../../shared/local-lib/i18n/translation.service';
import { DropdownOption } from '../../../../../shared/local-lib/services/options-helper.service';
import { SecurityService, UserInfo } from '../../../../../shared/local-lib/services/security.service';

type FeedbackType = 'Bug' | 'Suggestion' | 'Other';

@Component({
  selector: 'app-site-feedback-contact-modal',
  templateUrl: './site-feedback-contact-modal.component.html',
  styleUrls: ['./site-feedback-contact-modal.component.scss'],
  imports: [
    ModalComponent,
    ReactiveFormsModule,
    TextComponent,
    TextareaComponent,
    DropdownComponent,
    ButtonComponent,
    CheckboxComponent,
    LoaderComponent,
    TranslatePipe,
  ],
  providers: [],
})
export class SiteFeedbackContactModalComponent extends AbstractModalComponent {
  feedbackForm: FormGroup;
  feedbackType: FeedbackType = 'Bug';

  private readonly _i18n = inject(TranslationService);
  private readonly _http = inject(HttpClient);
  private readonly _security = inject(SecurityService);

  readonly user = signal<UserInfo | null>(null);
  /** Signed in, but sending without a name attached. */
  readonly anonymous = signal(false);

  readonly signedIn = computed(() => !!this.user());

  /**
   * The label is translated but the key is not: the type travels to the
   * backend and into whatever reads the reports, so it stays one word in one
   * language whoever is filling the form in.
   */
  readonly typeOptions = computed<DropdownOption[]>(() => [
    { key: 'Bug', value: this._i18n.t('feedback.typeBug') },
    { key: 'Suggestion', value: this._i18n.t('feedback.typeSuggestion') },
    { key: 'Other', value: this._i18n.t('feedback.typeOther') },
  ]);

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
    this._applyTypeValidators('Bug');

    this._security.currentUserData$.subscribe((user) => {
      this.user.set(user);
      // Signing in fills the address in, but only while it has not been
      // typed over - retyping it and then having it replaced would be rude.
      if (user?.email && !this.feedbackForm.controls['email'].dirty) {
        this.feedbackForm.controls['email'].setValue(user.email);
      }
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      type: ['Bug', Validators.required],
      email: [''],
      section: [''],
      title: [''],
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

  /**
   * Which fields are required depends on the type, because which fields are
   * even shown depends on the type. Fixing them at build time meant an
   * "Other" message could never be valid - and since Submit only acted on a
   * valid form, the button did nothing at all.
   */
  private _applyTypeValidators(type: FeedbackType): void {
    const required = type === 'Other' ? ['message'] : ['section', 'title'];

    for (const name of ['section', 'title', 'message']) {
      const control = this.feedbackForm.controls[name];
      control.setValidators(required.includes(name) ? [Validators.required] : []);
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  onTypeChange(type: string | number | boolean | undefined | null): void {
    this.feedbackType = type as FeedbackType;
    this.feedbackForm.patchValue({ type });
    this._applyTypeValidators(this.feedbackType);
  }

  setAnonymous(value: boolean): void {
    this.anonymous.set(value);
    if (value) {
      this.feedbackForm.controls['email'].setValue('');
    } else if (this.user()?.email) {
      this.feedbackForm.controls['email'].setValue(this.user()!.email!);
    }
  }

  onSubmit(): void {
    if (this.feedbackForm.invalid) {
      this.feedbackForm.markAllAsTouched();
      this.notificationService.showError(this._i18n.t('feedback.incomplete'));
      return;
    }

    const form = this.feedbackForm.value;
    this.loading.set(true);

    // The API names its columns as the database does; the form does not.
    this._http
      .post('/api/feedback', {
        type: form.type,
        section: form.section || null,
        title: form.title || null,
        email: form.email || null,
        anonymous: this.anonymous(),
        message: form.message || null,
        steps_to_reproduce: form.stepsToReproduce || null,
        expected_behavior: form.expectedBehavior || null,
        actual_behavior: form.actualBehavior || null,
        browser_device_info: form.browserDeviceInfo || null,
        details: form.details || null,
        why_important: form.whyImportant || null,
        additional_info: form.additionalInfo || null,
        // Where they were and what they were reading, so a report about "the
        // page" can be placed without asking.
        page_url: location.pathname + location.search,
        language: this._i18n.language(),
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.notificationService.showSuccess(this._i18n.t('feedback.thanks'));
          this.closeModal(true);
        },
        error: (e) => {
          this.loading.set(false);
          // The server's message is the useful one for a refusal it can
          // explain, such as too many messages in an hour.
          this.notificationService.showError(e?.error?.error ?? this._i18n.t('feedback.failed'));
        },
      });
  }

  onCancel(): void {
    this.closeModal(false);
  }
}
