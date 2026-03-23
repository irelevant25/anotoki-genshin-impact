const SITES_BOTTOM_FEEDBACK = Vue.createApp({
    template: html`
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Feedback</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-4 feedback-container">
                    <h1 class="text-center mb-4">Feedback & Bug Reports</h1>

                    <div class="mb-3">
                        <div class="submission-methods">
                            <div class="submission-method" :class="{ selected: submissionMethod === 'Github' }" @click="submissionMethod = 'Github'">
                                <div class="method-icon">🐙</div>
                                <div class="method-title">GitHub Issue</div>
                                <div class="method-desc">Submit directly to our GitHub repository (not anonymous)</div>
                            </div>
                            <div class="submission-method" :class="{ selected: submissionMethod === 'Email' }" @click="submissionMethod = 'Email'">
                                <div class="method-icon">✉️</div>
                                <div class="method-title">Email</div>
                                <div class="method-desc">Send through email (not anonymous)</div>
                            </div>
                            <div class="submission-method" :class="{ selected: submissionMethod === 'Google form' }" @click="submissionMethod = 'Google form'">
                                <div class="method-icon">📝</div>
                                <div class="method-title">Google Form</div>
                                <div class="method-desc">Submit through Google Form (anonymous)</div>
                            </div>
                        </div>
                    </div>

                    <!-- Success message after submission -->
                    <h3 v-show="submissionMethod" class="alert alert-success text-center">Thank you for choosing to submit via {{ submissionMethod }}!</h3>
                    <div v-show="submissionMethod === 'Github'">
                        <div class="pros-cons-container">
                            <div class="pros-section">
                                <h4>Pros:</h4>
                                <ul>
                                    <li>Your issue becomes publicly trackable with a unique ID</li>
                                    <li>Developers can directly engage with you for clarification</li>
                                    <li>You'll receive notifications about progress and resolution</li>
                                    <li>Others can contribute additional information or confirm the issue</li>
                                    <li>Helps establish development priorities for the team</li>
                                </ul>
                            </div>

                            <div class="cons-section">
                                <h4>Cons:</h4>
                                <ul>
                                    <li>Requires a GitHub account</li>
                                    <li>Your submission is not anonymous</li>
                                    <li>Public visibility of your report (though this helps others)</li>
                                    <li>May require more technical details than other methods</li>
                                </ul>
                            </div>
                        </div>
                        <div class="recommendations">
                            <h4>Recommendations:</h4>
                            <ul>
                                <li>Use a clear, descriptive title that summarizes the issue</li>
                                <li>Include the exact steps to reproduce the problem</li>
                                <li>Mention your browser/device details for better troubleshooting</li>
                                <li>Add screenshots if applicable (you can drag and drop images)</li>
                                <li>Check if similar issues already exist before submitting</li>
                                <li>Use proper formatting (markdown) for better readability</li>
                                <li>Be responsive if developers have follow-up questions</li>
                            </ul>
                        </div>
                        <p class="final-note">Once you click "Go to the {{ submissionMethod }}" button, you'll be redirected to {{ submissionMethod }}.</p>
                    </div>
                    <div v-show="submissionMethod === 'Email'">
                        <div class="pros-cons-container">
                            <div class="pros-section">
                                <h4>Pros:</h4>
                                <ul>
                                    <li>Direct communication with our development team</li>
                                    <li>Ability to include attachments (screenshots, log files)</li>
                                    <li>You can use your preferred email client</li>
                                    <li>Easier to provide additional information later by replying</li>
                                    <li>More private than public issue trackers</li>
                                </ul>
                            </div>
                            <div class="cons-section">
                                <h4>Cons:</h4>
                                <ul>
                                    <li>No public tracking number for your submission</li>
                                    <li>Not anonymous - we'll see your email address</li>
                                    <li>Others can't see or contribute to your feedback</li>
                                    <li>May take longer to get a response during busy periods</li>
                                </ul>
                            </div>
                        </div>
                        <div class="recommendations">
                            <h4>Recommendations:</h4>
                            <ul>
                                <li>Keep the generated subject line intact for our categorization</li>
                                <li>Add screenshots as attachments rather than pasting them inline</li>
                                <li>If you have large files to share, consider using a file sharing service and including the link</li>
                                <li>Make sure your email address is one you check regularly</li>
                                <li>If you don't receive a confirmation within 2 business days, consider following up</li>
                                <li>Add our email address to your contacts to prevent replies from going to spam</li>
                            </ul>
                        </div>
                        <p class="final-note">Once you click "Go to the {{ submissionMethod }}" button, your default email client will open.</p>
                    </div>
                    <div v-show="submissionMethod === 'Google form'">
                        <div class="pros-cons-container">
                            <div class="pros-section">
                                <h4>Pros:</h4>
                                <ul>
                                    <li>Completely anonymous - we won't know who submitted it</li>
                                    <li>Simple and straightforward submission process</li>
                                    <li>No account required to submit feedback</li>
                                    <li>Structured format helps us categorize issues efficiently</li>
                                    <li>Great for sensitive feedback or suggestions</li>
                                </ul>
                            </div>

                            <div class="cons-section">
                                <h4>Cons:</h4>
                                <ul>
                                    <li>No way to follow up with you for clarification</li>
                                    <li>Can't notify you when the issue is resolved</li>
                                    <li>Limited ability to provide additional information later</li>
                                    <li>May not be able to include detailed screenshots/attachments</li>
                                </ul>
                            </div>
                        </div>

                        <div class="recommendations">
                            <h4>Recommendations:</h4>
                            <ul>
                                <li>Be as detailed and specific as possible in your initial submission</li>
                                <li>For visual bugs, describe exactly what you see since you can't attach images</li>
                                <li>Include your browser and device information for technical issues</li>
                                <li>If the issue is complex, consider one of the non-anonymous methods instead</li>
                                <li>Try to answer all optional fields - they help us understand the context</li>
                                <li>Double-check your submission before final submission as you can't edit it later</li>
                            </ul>
                        </div>

                        <p class="final-note">Once you click "Go to the {{ submissionMethod }}" button, you'll be redirected to a Google form.</p>
                    </div>

                    <button v-show="submissionMethod" class="btn btn-primary w-100" @click="redirect">Go to the {{ submissionMethod }}</button>
                </div>
            </div>
        </div>
    `,

    data() {
        return {
            submissionMethod: '',
            submitted: false,
        };
    },

    methods: {
        redirect() {
            let url;
            if (this.submissionMethod === 'Github') {
                url = 'https://github.com/irelevant25/genshin-quiz/issues/new';
            } else if (this.submissionMethod === 'Email') {
                url = 'mailto:frantisekpastorek@gmail.com';
            } else if (this.submissionMethod === 'Google form') {
                url = 'https://forms.gle/ouAhmJxz5YpGw8t28';
            }
            window.open(url, '_blank');
        },
    },
});

document.addEventListener('DOMContentLoaded', () => {
    SITES_BOTTOM_FEEDBACK.mount('#site-feedback-modal');
});
