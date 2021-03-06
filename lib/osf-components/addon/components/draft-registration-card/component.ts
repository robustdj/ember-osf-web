import { tagName } from '@ember-decorators/component';
import Component from '@ember/component';
import { action, computed } from '@ember/object';
import RouterService from '@ember/routing/router-service';
import { inject as service } from '@ember/service';
import { htmlSafe } from '@ember/string';

import { layout } from 'ember-osf-web/decorators/component';
import DraftRegistration from 'ember-osf-web/models/draft-registration';
import { RegistrationMetadata } from 'ember-osf-web/models/registration-schema';
import Analytics from 'ember-osf-web/services/analytics';

import styles from './styles';
import template from './template';

@layout(template, styles)
@tagName('')
export default class DraftRegistrationCard extends Component {
    @service analytics!: Analytics;
    @service router!: RouterService;

    // Required arguments
    draftRegistration!: DraftRegistration;

    // Optional arguments
    onDelete?: (draftRegistration?: DraftRegistration) => void;
    decrementCount?: () => void;

    // Private properties
    deleteModalOpen = false;

    @computed('draftRegistration.{registrationSchema,registrationMetadata}')
    get percentComplete() {
        let requiredQuestions = 0;
        let answeredRequiredQuestions = 0;
        const schema = this.draftRegistration.registrationSchema.get('schema');
        if (!schema) {
            return -1;
        }
        const metadata = this.draftRegistration.registrationMetadata;
        if (!metadata) {
            return 0;
        }
        schema.pages.forEach(page =>
            page.questions.forEach(question => {
                if (question.type === 'object' && question.properties) {
                    question.properties.forEach(property => {
                        if (!property.required) {
                            return;
                        }

                        requiredQuestions++;

                        if (!(question.qid in metadata)) {
                            return;
                        }

                        const answers = metadata[question.qid];
                        if ('value' in answers) {
                            const value = answers.value as RegistrationMetadata;
                            if (value && property.id in value) {
                                const propertyValue = value[property.id].value;
                                if (Array.isArray(propertyValue) ? propertyValue.length : propertyValue) {
                                    answeredRequiredQuestions++;
                                }
                            }
                        }
                    });
                } else if (question.required) {
                    requiredQuestions++;
                    if (question.qid in metadata && 'value' in metadata[question.qid]) {
                        const { value } = metadata[question.qid];
                        if (Array.isArray(value) ? value.length : value) {
                            answeredRequiredQuestions++;
                        }
                    }
                }
            }));
        return requiredQuestions ? (answeredRequiredQuestions / requiredQuestions) * 100 : -1;
    }

    @computed('percentComplete')
    get showProgress() {
        return this.percentComplete >= 0;
    }

    @computed('percentComplete')
    get progressStyle() {
        return htmlSafe(`width: ${this.percentComplete}%`);
    }

    @computed('draftRegistration', 'showProgress', 'percentComplete')
    get enableRegister() {
        if (this.draftRegistration) {
            return this.showProgress ? this.percentComplete === 100 : true;
        }
        return false;
    }

    @action
    edit() {
        this.router.transitionTo(
            'guid-node.drafts',
            this.draftRegistration.branchedFrom.get('id'),
            this.draftRegistration.id,
        );
    }

    @action
    delete() {
        this.set('deleteModalOpen', true);
    }

    @action
    cancelDelete() {
        this.set('deleteModalOpen', false);
    }

    @action
    async confirmDelete() {
        this.set('deleteModalOpen', false);
        await this.draftRegistration.destroyRecord();
        if (this.onDelete) {
            this.onDelete(this.draftRegistration);
        }
    }

    @action
    register() {
        this.router.transitionTo(
            'guid-node.drafts.register',
            this.draftRegistration.branchedFrom.get('id'),
            this.draftRegistration.id,
        );
    }
}
