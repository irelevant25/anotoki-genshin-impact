import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ROUTE_MAP } from '../../../../shared/routing-definition';
import { TranslatePipe } from '../../../../shared/local-lib/i18n/translate.pipe';

@Component({
  selector: 'app-quizzes',
  templateUrl: './quizzes.component.html',
  styleUrls: ['./quizzes.component.scss'],
  imports: [RouterModule, TranslatePipe],
  providers: []
})
export class QuizzesComponent {
  readonly QUIZZES = [
    {
      path: ROUTE_MAP.map['quizzes'].banners.path,
      title: 'quiz.banners.title',
      badgeIcon: false,
      helpIcon: true,
      modalTitle: 'quiz.banners.about',
      cardImage: 'assets/character/wish_icon/Venti.avif',
      cardInfo: 'quiz.banners.info',
    },
    {
      path: ROUTE_MAP.map['quizzes'].pixelate.path,
      title: 'quiz.pixelate.title',
      badgeIcon: false,
      helpIcon: true,
      modalTitle: 'quiz.pixelate.about',
      cardImage: 'assets/character/wish_icon/Kinich.avif',
      cardInfo: 'quiz.pixelate.info',
    },
    {
      path: ROUTE_MAP.map['quizzes'].mismatch.path,
      title: 'quiz.mismatch.title',
      badgeIcon: false,
      helpIcon: true,
      modalTitle: 'quiz.mismatch.about',
      cardImage: 'assets/character/wish_icon/Arlecchino.avif',
      cardInfo: 'quiz.mismatch.info',
    },
    {
      path: ROUTE_MAP.map['quizzes'].music.path,
      title: 'quiz.music.title',
      badgeIcon: false,
      helpIcon: true,
      modalTitle: 'quiz.music.about',
      cardImage: 'assets/character/wish_icon/Xinyan.avif',
      cardInfo: 'quiz.music.info',
    },
    {
      path: ROUTE_MAP.map['quizzes'].dish.path,
      title: 'quiz.dish.title',
      badgeIcon: false,
      helpIcon: true,
      modalTitle: 'quiz.dish.about',
      cardImage: 'assets/character/wish_icon/Xiangling.avif',
      cardInfo: 'quiz.dish.info',
    },
    {
      path: ROUTE_MAP.map['quizzes'].voice.path,
      title: 'quiz.voice.title',
      badgeIcon: false,
      helpIcon: true,
      modalTitle: 'quiz.voice.about',
      cardImage: 'assets/character/wish_icon/Yun Jin.avif',
      cardInfo: 'quiz.voice.info',
    },
  ];
}
