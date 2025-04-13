import { Routes } from '@angular/router';
import { GameComponent } from './game/game.coponent';

export const routes: Routes = [
  { path: '', component: GameComponent },
  { path: '**', redirectTo: '' },
];
