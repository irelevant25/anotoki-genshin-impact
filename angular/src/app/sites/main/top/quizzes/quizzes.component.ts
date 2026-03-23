import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ROUTE_MAP } from '../../../../shared/routing-definition';

@Component({
  selector: 'app-quizzes',
  templateUrl: './quizzes.component.html',
  styleUrls: ['./quizzes.component.scss'],
  imports: [RouterModule],
  providers: []
})
export class QuizzesComponent {
  readonly QUIZZES = [
    {
      path: ROUTE_MAP.map['quizzes'].banners.path,
      title: ROUTE_MAP.map['quizzes'].banners.title,
      badgeIcon: false,
      helpIcon: true,
      modalTitle: 'About Banners',
      cardImage: 'assets/character/wish/Venti.avif',
      cardInfo: 'Test your knowledge by identifying characters from their namecards/banners.',
    },
    {
      id: ROUTE_MAP.map['quizzes'].pixelate.path,
      title: ROUTE_MAP.map['quizzes'].pixelate.title,
      badgeIcon: false,
      helpIcon: true,
      modalTitle: 'About Characters Pixelate',
      cardImage: 'assets/character/wish/Kinich.avif',
      cardInfo: 'Challenge yourself to identify characters from their heavily pixelated portraits.',
    },
    {
      id: ROUTE_MAP.map['quizzes'].mismatch.path,
      title: ROUTE_MAP.map['quizzes'].mismatch.title,
      badgeIcon: false,
      helpIcon: true,
      modalTitle: 'About Characters Mismatch',
      cardImage: 'assets/character/wish/Arlecchino.avif',
      cardInfo: 'Test your character knowledge by finding the "odd one out" among four character icons.',
    },
    {
      id: ROUTE_MAP.map['quizzes'].music.path,
      title: ROUTE_MAP.map['quizzes'].music.title,
      badgeIcon: false,
      helpIcon: true,
      modalTitle: 'About Music Quiz',
      cardImage: 'assets/character/wish/Xinyan.avif',
      cardInfo: 'Test your music knowledge by identifying characters from their demo music.',
    },
    {
      id: ROUTE_MAP.map['quizzes'].dish.path,
      title: ROUTE_MAP.map['quizzes'].dish.title,
      badgeIcon: false,
      helpIcon: true,
      modalTitle: 'About Dish',
      cardImage: 'assets/character/wish/Xiangling.avif',
      cardInfo: 'Test your knowledge by identifying characters from their dish.',
    },
    {
      id: ROUTE_MAP.map['quizzes'].voice.path,
      title: ROUTE_MAP.map['quizzes'].voice.title,
      badgeIcon: false,
      helpIcon: true,
      modalTitle: 'About Voice Quiz',
      cardImage: 'assets/character/wish/Yun Jin.avif',
      cardInfo: 'Test your voice knowledge by identifying characters from their voice.',
    },
  ];
}
