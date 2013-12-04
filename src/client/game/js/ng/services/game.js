
IronbaneApp
    .factory('Game', ['$log', '$window', '$http', '$timeout', '$filter', 'SocketHandler','TerrainHandler', 'HUDHandler', 'TextureHandler','MeshHandler', 'Snow', 'Player',
    function($log, $window, $http, $timeout, $filter, socketHandler, terrainHandler, hudHandler, textureHandler, MeshHandler, Snow, Player) { // using $window to reveal the globals
        // make this private so that it can't be called directly


        var Game = function() {
            // cheap hack to get mouthwash on the chat bubble
            socketHandler.initConnection();
       
            this.mouthwash = $filter('mouthwash');

            // hacked in until injection day
            this.textureHandler = textureHandler;
            console.log(this.textureHandler)
            this.meshHandler = MeshHandler;
            this.terrainHandler = terrainHandler;

            $window.terrainHandler = terrainHandler;
            $window.socketHandler = socketHandler;

            $window.textureHandler = textureHandler;

            // adjustable framerate
            this._lastFrameTime = 0;
            this._maxFrameTime = 0.03;
            this._elapsedTime = 0;

            this.scene = null;
            this.camera = null;
            this.renderer = null;
            this.stats = null;
            this.projector = null;
            this.player = null;
            this.newLevelEditor = null;
            this.unitList = [];
            this.showingGame = false;

            this.loadingMessages = _.shuffle([
                "Spawning random annoying monsters",
                "Setting a higher gravity just for you",
                "Testing your patience",
                "Insert funny message here",
                "Is this even helping?",
                "We lost Ironbane",
                "Making cool swords and daggers",
                "I hate this job",
                "Laying bridges",
                "Painting signs",
                "Brewing potions",
                "Making cheese",
                "Unleashing rats",
                "Plucking apples",
                "Mowing grass",
                "Making spooky dungeons",
                "Recording scary sounds",
                "Pixelating the sun",
                "Annoying developers",
                "Are your shoelaces tied?",
                "Telling Ironbane where to hide",
                "Spawning overpowered equipment",
                "Painting castle walls",
                "Feeding the staff",
                "Teleporting you above lava",
                "Chasing Ironbane",
                "Showing a random guy walking on the screen"
            ]);

            this.currentLoadingMessage = "Initializing";
            this.currentLoadingTickTimer = 0.0;
            this.currentLoadingStepCount = 0;

            // Used for dynamically added objects
            this.waypointOffset = -1000000;
        };

        Game.prototype.start = function() {
            var game = this;

            if (!$window.Detector.webgl) {
                game.hudHandler.ResizeFrame();
                return;
            }

            this.scene = new $window.THREE.Scene();
            this.octree = new $window.THREE.Octree();
            this.camera = new $window.THREE.PerspectiveCamera(75, $window.innerWidth / $window.innerHeight, 0.1, 100000);

            this.camera.position.x = 0;
            this.camera.position.y = 3;
            this.camera.position.z = 0;

            this.scene.add(this.camera);

            var container = null;
            var info = null;

            this.projector = new $window.THREE.Projector();

            this.renderer = new $window.THREE.WebGLRenderer({
                antialias: false
            });
            this.renderer.shadowMapType = THREE.BasicShadowMap;
            this.renderer.shadowMapEnabled = true;
            this.renderer.shadowMapAutoUpdate = true;
            this.renderer.shadowMapSoft = false;

            this.shadowLight = new THREE.DirectionalLight( 0xffffff, 1);
            this.shadowLight.onlyShadow = true;
            this.shadowLight.shadowMapWidth = 2048;
            this.shadowLight.shadowMapHeight = 2048;
            this.shadowLight.shadowCameraNear   = 5.1;
            this.shadowLight.castShadow   = true;
            this.shadowLight.shadowDarkness   = 0.3;

            // this.renderer.sortObjects = false;
            this.renderer.setSize($window.innerWidth, $window.innerHeight);

            // temp hack for xmas 2013
            this.snow = new Snow(this.scene);

            $('#gameFrame').append(this.renderer.domElement);

            if (isEditor) {
                this.stats = new Stats();
                this.stats.domElement.style.position = 'absolute';
                $('#gameFrame').append(this.stats.domElement);
            }

            hudHandler.ResizeFrame();

            var charUrl = '';
            if ($window.startdata.user === 0) {
                charUrl = '/api/guest/characters';
            } else {
                charUrl = '/api/user/' + $window.startdata.user + '/characters';
            }

            var loop = function() {
                if(!game.isRunning) {
                    return;
                }

                var currTime = window.performance.now();
                var delta = (currTime - game._lastFrameTime) / 1000;
                var frameTime = Math.min(delta, game._maxFrameTime);

                requestAnimationFrame(loop);

                game.tick(frameTime);
                game.render(frameTime);

                game._elapsedTime += delta;
                game._lastFrameTime = currTime;

                $window.TWEEN.update();
            };

            // todo: character service
            $http.get(charUrl)
                .then(function(response) {
                    $window.chars = response.data;
                    $window.charCount = $window.chars.length;
                }, function(response) {
                    // what to do here?
                    $window.chars = [];
                    $window.charCount = 0;

                    $log.error('error loading character data! ', response);
                })
                .then(function() {

                    $window.startdata.characterUsed = hudHandler.GetLastCharacterPlayed();

                    hudHandler.MakeCharSelectionScreen();
                    terrainHandler.tick(0.1);

                    game.isRunning = true;
                    game.startTime = window.performance.now(); // shimmed!
                    game._lastFrameTime = game.startTime;

                    loop();
                });

            this.renderer.setClearColor($window.ColorEnum.LIGHTBLUE, 1);
        };

        Game.prototype.render = function() {

            this.renderer.clear();

            this.renderer.render(this.scene, this.camera);

            if ( this.newLevelEditor ) {
                this.renderer.render(this.newLevelEditor.sceneHelpers, this.camera);
            }


            $window.debug.Clear();
        };

        Game.prototype.tick = function(dTime) {
            var game = this;

            // if ( showEditor  ) {
            $window.debug.tick(dTime);
            // }

            if (game.stats) {
                game.stats.update();
            }

            if ($window.showEditor) {
                $window.levelEditor.tick(dTime);
            }
            hudHandler.tick(dTime);

            this.snow.tick(this._elapsedTime);

            if (!$window.socketHandler.loggedIn && !$window.cinema.IsPlaying()) {
                game.camera.position.x = $window.previewLocation.x + (Math.cos(new Date().getTime() / 20000) * $window.previewDistance) - 0;
                game.camera.position.y = $window.previewLocation.y + $window.previewHeight;
                game.camera.position.z = $window.previewLocation.z + (Math.sin(new Date().getTime() / 20000) * $window.previewDistance) - 0;
                game.camera.lookAt($window.previewLocation);
            }

            terrainHandler.tick(dTime);

            if (socketHandler.loggedIn) {
                // Add the player once we have terrain we can walk on

                if (terrainHandler.status === $window.terrainHandlerStatusEnum.LOADED &&
                    !terrainHandler.IsLoadingCells()) {
                    if (!game.player) {
                        game.player = new Player(socketHandler.spawnLocation, new $window.THREE.Euler(0, socketHandler.spawnRotation, 0), $window.socketHandler.playerData.id, $window.socketHandler.playerData.name);
                    }
                }
            }

            $window.particleHandler.tick(dTime);

            for (var x = 0; x < game.unitList.length; x++) {
                game.unitList[x].tick(dTime);
            }

            if ( game.player ) {
                if ( le("globalEnable") && game.newLevelEditor ) {
                    game.newLevelEditor.tick(dTime);
                }
                else {
                    game.player.tick(dTime);
                }
            }

            $window.cinema.tick(dTime);

            $window.sw("THREE.Object3DIdCount", $window.THREE.Object3DIdCount);
            $window.sw("THREE.GeometryIdCount", $window.THREE.GeometryIdCount);
            $window.sw("THREE.MaterialIdCount", $window.THREE.MaterialIdCount);
            $window.sw("THREE.TextureIdCount", $window.THREE.TextureIdCount);



            // Keep track of what's going with the loading of the game
            var doneLoading = true;

            if ( !$window.isProduction ) game.currentLoadingMessage = "All set";

            if (terrainHandler.status !== $window.terrainHandlerStatusEnum.LOADED ) {
                doneLoading = false;
                if ( !$window.isProduction ) game.currentLoadingMessage = "Loading Terrain";
            }
            else if (terrainHandler.IsLoadingCells() ) {
                doneLoading = false;
                if ( !$window.isProduction ) game.currentLoadingMessage = "Loading Cells";
            }
            else if ( !soundHandler.loadedMainMenuMusic ) {
                doneLoading = false;
                if ( !$window.isProduction ) game.currentLoadingMessage = "Loading Music";
            }

            if ( !game.showingGame && doneLoading ) {
                if (!socketHandler.inGame) {
                    hudHandler.MakeSoundButton();
                }

                game.showingGame = true;

                $timeout(function() {
                    $('#gameFrame').animate({
                        opacity: 1.00
                    }, 1000, function() {
                        $("#gameFrame").css('opacity', '');

                        $("#loadingBarMessage").text("Loading Area");
                    });
                }, 500);
            }

            if ( !doneLoading ) {
                game.currentLoadingTickTimer -= dTime;

                if ( game.currentLoadingTickTimer <= 0.0 ) {

                    // Change the message on production
                    if ( $window.isProduction ) {
                        game.currentLoadingTickTimer = getRandomFloat(0.5, 3.0);
                        game.currentLoadingMessage = ChooseSequenced(game.loadingMessages);
                    }
                    else {
                        game.currentLoadingTickTimer = 0.5;
                    }

                    //for (var i = 0; i < game.currentLoadingStepCount; i++) {
                        //game.currentLoadingMessage += ".";
                    //}

                    // TODO convert to angular
                    $("#loadingBarMessage").text(game.currentLoadingMessage);
                }
            }
            $window.relativeMouse = $window.mouse.clone().sub($window.lastMouse);
            $window.lastMouse = $window.mouse.clone();
        };

        return Game;
    }]);
