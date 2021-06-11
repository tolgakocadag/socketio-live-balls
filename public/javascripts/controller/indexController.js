app.controller('indexController', ['$scope', 'indexFactory', ($scope, indexFactory) => {

    $scope.messages = [];
    $scope.players = {};
""
    $scope.init = () => {
        const username = prompt('Please enter username');

        if(username)
            initSocket(username);
        else 
            return false;
    }

    function scrollTop() {
        setTimeout(() => {
            const element = document.getElementById('chat-area');
            element.scrollTop = element.scrollHeight;                    
        });
    }

    function showBubble(id, message) {
        $('#'+id).find('.message').show().html(message);

        setTimeout(() => {
            $('#'+id).find('.message').hide();
        }, 2000);
    }

    async function initSocket(username) {
        const connectionOptions = {
            reconnectionAttempts: 3,
            reconnectionDelay: 600
        }
    
        try{
            const socket = await indexFactory.connectSocket('http://localhost:3000', connectionOptions);
            socket.emit('newUser', {username});

            socket.on('initPlayers', (players) => {
                $scope.players = players;
                $scope.$apply();
            });

            socket.on('newUser', (data) => {
                const messageData = {
                    type: {
                        code: 0, //server or user message
                        message: 1 // login or disconnect message
                    }, //info
                    username: data.username
                };
                $scope.messages.push(messageData);
                $scope.players[data.id] = data;
                $scope.$apply();
                scrollTop();
            });

            socket.on('disUser', (data) => {
                console.log(data);
                const messageData = {
                    type: {
                        code: 0, //server or user message
                        message: 0 // login or disconnect message
                    }, //info
                    username: data.username
                };
                $scope.messages.push(messageData);
                delete $scope.players[data.id];
                $scope.$apply();
                scrollTop();
            });

            socket.on('animate',(data) => {
                $('#'+ data.socketId).animate({'left': data.x, 'top': data.y}, () => {
                    animate = false;
                });
            });

            socket.on('newMessage', (data) => {
                console.log(data);
                $scope.messages.push(data);
                $scope.$apply();
                showBubble(data.socketId,data.text);
                scrollTop();
            });

            let animate = false;
            $scope.onClickPlayer = ($event) => {
                if(!animate){

                    let x = $event.offsetX;
                    let y = $event.offsetY;

                    socket.emit('animate', {x,y});

                    animate = true;
                    $('#'+ socket.id).animate({'left': x, 'top': y}, () => {
                        animate = false;
                    });
                }
            };

            $scope.newMessage = () => {
                console.log("çalıştı");
                let message = $scope.message;

                const messageData = {
                    type: {
                        code: 1, //server or user message
                    },
                    username: username,
                    text: message
                };
                $scope.messages.push(messageData);
                $scope.message = '';

                socket.emit('newMessage', messageData);

                showBubble(socket.id,message);
                scrollTop();
            };
        }catch(err){
            console.log(err);
        }
    }
}]);