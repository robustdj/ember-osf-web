import { Factory, faker, Trait, trait } from 'ember-cli-mirage';

import Institution from 'ember-osf-web/models/institution';

import { randomGravatar } from '../utils';

export interface InstitutionTraits {
    withInstitutionalUsers: Trait;
}

export default Factory.extend<Institution & InstitutionTraits>({
    name() {
        return faker.company.companyName();
    },
    description() {
        return faker.company.catchPhrase();
    },
    assets() {
        return {
            logo: randomGravatar(100),
        };
    },
    withInstitutionalUsers: trait<Institution>({
        afterCreate(institution, server) {
            server.createList('institutional-user', 10, { institution });
        },
    }),
    currentUserIsAdmin: true,
});

declare module 'ember-cli-mirage/types/registries/schema' {
    export default interface MirageSchemaRegistry {
        institutions: Institution;
    } // eslint-disable-line semi
}
