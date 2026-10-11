import { EnvironmentProviders, Injector, inject } from '@angular/core';
import { AnotokiAuth } from '@anotoki/lib/auth';
import { AnotokiPeopleConfig, PeopleDeleteQuestion, PeoplePerson, provideAnotokiPeople } from '@anotoki/lib/people';
import { SecurityService } from '../../shared/local-lib/services/security.service';
import { SiteSettingsService } from '../../shared/local-lib/services/site-settings.service';
import { accountDates, MIGRATIONS_ROUTE } from '../../shared/site-admin-tools';
import { QuizProgressService } from '../main/features/quizzes/shared/quiz-progress.service';

/** A person's count in one of the server's columns (games, results, feedback): a number, or 0 where there is none. */
function countOf(person: PeoplePerson, column: string): number {
  const value = person[column];
  return typeof value === 'number' ? value : 0;
}

/**
 * What the site tells the library's People page (@anotoki/lib/people/page,
 * /admin/people): this site's record of the accounts that use it - kept by the
 * server as each person comes (the library's RecordPerson), their names
 * blanked when the IAM deletes their account (the scrub) - for this site's
 * ADMIN, with the server's columns (saved games, quiz results, feedback sent).
 *
 * Delete takes a person's games - their saved games, quiz results and
 * statistics (the server's delete hook) - and asks in the site's own words,
 * because the family's question would say everything goes: their record here
 * and what they sent as feedback stay. Deleting one's own, the quizzes open
 * in this tab forget the games they hold.
 */
function peopleConfig(): AnotokiPeopleConfig {
  const security = inject(SecurityService);
  const auth = inject(AnotokiAuth);
  const settings = inject(SiteSettingsService);

  return {
    isAdmin: () => security.role() === 'ADMIN',
    me: () => auth.sub(),
    lead: 'Everybody who has signed in here, and what the site keeps of them - their saved games, quiz results and the feedback they sent - the newest first.',
    delete: {
      label: 'Delete their games',
      question: (person): PeopleDeleteQuestion => {
        const name = person.name || `person ${person.sub}`;
        const you = person.sub === auth.sub() ? ' This is you.' : '';
        return {
          title: `Delete the games of ${name}?`,
          message: `Their saved games (${countOf(person, 'games')}), quiz results (${countOf(person, 'results')}) and statistics go, and cannot be brought back. What they sent as feedback stays, and so does their anotoki account: playing again, they start afresh.${you}`,
          confirm: 'Delete their games',
        };
      },
      done: (person): void => {
        if (person.sub === auth.sub()) {
          inject(QuizProgressService).forgetPersonGames();
        }
      },
    },
    // The days are the server's own (visitors.keep_days, relayed in the public settings), as the visitor notice says them.
    visitorsLine: (visitors) =>
      `${visitors.count} ${visitors.count === 1 ? 'visitor' : 'visitors'} - people playing without signing in, whose games the site keeps for ${settings.visitorKeepDays()} days after their last visit.`,
    formatDate: accountDates(inject(Injector)),
    migrationsRoute: MIGRATIONS_ROUTE,
  };
}

/**
 * The People page's configuration, on the admin panel's route: the page reads
 * it itself, so it stays with the panel (and its quiz service with it) - out
 * of the first load.
 */
export function provideAdminPeople(): EnvironmentProviders {
  return provideAnotokiPeople(peopleConfig);
}
