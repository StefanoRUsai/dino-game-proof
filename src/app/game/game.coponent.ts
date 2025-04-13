import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  HostListener,
} from '@angular/core';
import { Engine, Runner, Bodies, Body, Composite, Events } from 'matter-js';

@Component({
  selector: 'app-game',
  standalone: true,
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
})
export class GameComponent implements AfterViewInit {
  @ViewChild('gameCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private engine!: Engine;
  private runner!: Runner;
  private player!: Body;
  private ground!: Body;
  private obstacles: Body[] = [];
  private obstacleTimer = 0;

  private dinoImg = new Image();
  private cactusImg = new Image();
  private birdImg = new Image();
  private groundTileImg = new Image();

  private score = 0;
  private scoreInterval!: ReturnType<typeof setInterval>;
  private gameOver = false;

  private canvasWidth = 800;
  private canvasHeight = 300;
  private groundOffset = 0;
  private groundSpeed = 5;

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;

    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    const imagesToLoad = [
      { img: this.dinoImg, src: 'assets/dino.png' },
      { img: this.cactusImg, src: 'assets/cactus.png' },
      { img: this.birdImg, src: 'assets/bird.png' },
      { img: this.groundTileImg, src: 'assets/ground.png' },
    ];

    let loaded = 0;
    imagesToLoad.forEach(({ img, src }) => {
      img.onload = img.onerror = () => {
        loaded++;
        if (loaded === imagesToLoad.length) {
          this.initGame();
        }
      };
      img.src = src;
    });
  }

  private initGame() {
    this.engine = Engine.create();
    this.runner = Runner.create();

    this.player = Bodies.rectangle(100, 220, 40, 60, {
      restitution: 0,
      friction: 0,
      label: 'player',
    });

    this.ground = Bodies.rectangle(400, 290, 800, 20, {
      isStatic: true,
      label: 'ground',
    });

    Composite.add(this.engine.world, [this.player, this.ground]);

    Events.on(this.engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
        const labels = [pair.bodyA.label, pair.bodyB.label];
        if (
          labels.includes('player') &&
          (labels.includes('cactus') || labels.includes('bird'))
        ) {
          this.gameOver = true;
        }
      }
    });

    Runner.run(this.runner, this.engine);

    this.scoreInterval = setInterval(() => {
      if (!this.gameOver) this.score++;
    }, 100);

    this.gameLoop();
  }

  private gameLoop() {
    if (!this.ctx) return;

    if (this.gameOver) {
      this.ctx.font = '28px Arial';
      this.ctx.fillStyle = 'black';
      this.ctx.fillText('Game Over - Premi Enter per ricominciare', 120, 150);
      return;
    }

    this.drawBackground();
    this.spawnObstaclesLogic();
    this.moveObstacles();
    this.drawEntities();
    this.drawScore();

    requestAnimationFrame(() => this.gameLoop());
  }

  private drawBackground() {
    this.ctx.fillStyle = '#cceeff';
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    const tileWidth = 64;
    for (let x = -this.groundOffset; x < this.canvasWidth; x += tileWidth) {
      if (this.groundTileImg.complete && this.groundTileImg.naturalWidth > 0) {
        this.ctx.drawImage(this.groundTileImg, x, 270, tileWidth, 30);
      } else {
        this.ctx.fillStyle = '#44aa44';
        this.ctx.fillRect(x, 270, tileWidth - 2, 30);
      }
    }
    this.groundOffset = (this.groundOffset + this.groundSpeed) % tileWidth;
  }

  private spawnObstaclesLogic() {
    if (this.gameOver) return;

    this.obstacleTimer--;
    if (this.obstacleTimer <= 0) {
      const isFlying = Math.random() < 0.3;
      const label = isFlying ? 'bird' : 'cactus';
      const height = isFlying ? 30 : 40;
      const yPos = isFlying ? 200 : 250;

      const obs = Bodies.rectangle(800, yPos, 30, height, {
        label,
        isStatic: true,
      });

      this.obstacles.push(obs);
      Composite.add(this.engine.world, obs);
      this.obstacleTimer = 80 + Math.floor(Math.random() * 60);
    }

    this.obstacles = this.obstacles.filter((o) => o.position.x > -50);
  }

  private moveObstacles() {
    const speed = -5;
    this.obstacles.forEach((obs) => {
      Body.translate(obs, { x: speed, y: 0 });
    });
  }

  private drawEntities() {
    // Player
    if (this.dinoImg.complete && this.dinoImg.naturalWidth > 0) {
      this.ctx.drawImage(
        this.dinoImg,
        this.player.position.x - 25,
        this.player.position.y - 30,
        50,
        60
      );
    } else {
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(
        this.player.position.x - 20,
        this.player.position.y - 30,
        40,
        60
      );
    }

    // Obstacles
    this.obstacles.forEach((obs) => {
      if (obs.label === 'cactus') {
        if (this.cactusImg.complete && this.cactusImg.naturalWidth > 0) {
          this.ctx.drawImage(
            this.cactusImg,
            obs.position.x - 10,
            obs.position.y - 25,
            30,
            50
          );
        } else {
          this.ctx.fillStyle = '#a00';
          this.ctx.fillRect(obs.position.x - 10, obs.position.y - 25, 20, 40);
        }
      } else if (obs.label === 'bird') {
        if (this.birdImg.complete && this.birdImg.naturalWidth > 0) {
          this.ctx.drawImage(
            this.birdImg,
            obs.position.x - 15,
            obs.position.y - 20,
            40,
            40
          );
        } else {
          this.ctx.fillStyle = '#00f';
          this.ctx.fillRect(obs.position.x - 15, obs.position.y - 20, 30, 30);
        }
      }
    });
  }

  private drawScore() {
    this.ctx.font = '20px monospace';
    this.ctx.fillStyle = '#222';
    this.ctx.fillText(`Score: ${this.score}`, this.canvasWidth - 130, 30);
  }

  @HostListener('window:keydown', ['$event'])
  handleInput(event: KeyboardEvent) {
    if (event.code === 'Space' && !this.gameOver) {
      const canJump = Math.abs(this.player.velocity.y) < 1;
      if (canJump) {
        Body.setVelocity(this.player, { x: 0, y: -10 });
      }
    }

    if (
      (event.code === 'ArrowDown' || event.code === 'KeyS') &&
      !this.gameOver
    ) {
      Body.scale(this.player, 1, 0.5);
      this.player.position.y += 15;
    }

    if (event.code === 'Enter' && this.gameOver) {
      location.reload();
    }
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyUp(event: KeyboardEvent) {
    if (
      (event.code === 'ArrowDown' || event.code === 'KeyS') &&
      !this.gameOver
    ) {
      Body.scale(this.player, 1, 2);
      this.player.position.y -= 15;
    }
  }
}
