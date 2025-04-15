import { Routes } from '@angular/router';
import { GameComponent } from './game/game.coponent';
import { CrosswordComponent } from './crossword/crossword.coponent';

export const routes: Routes = [
  { path: '', component: CrosswordComponent },
  { path: '**', redirectTo: '' },
];
