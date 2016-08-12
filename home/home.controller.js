'use strict';
var app = angular.module('app')
    .controller('HomeController', ['CastReceiver', 'UserService', 'AuthenticationService', '$rootScope', '$scope', '$timeout','config',
        function(CastReceiver, UserService, AuthenticationService, $rootScope, $scope, $timeout,config) {
            /*$scope.advertisements = [{
                "adId":"QORQL_AD_0",
                "adPriority":"LOW",
                "adName":"QORQL_AD_0",
                "adUrl":"images/ad-01.png",
                "adMimeType":"image/png",
                "adTime":"",
                "adCount":Infinity,
                "adIntervel":0,
                "lastDisplayed":0,
                "showticker":true
                }, 

                {
                    "adId":"QORQL_AD_1",
                    "adPriority":"LOW",
                    "adName":"QORQL_AD_1",
                    "adUrl":"images/qorql.png",
                    "adMimeType":"image/png",
                    "adTime":"10",
                    "adCount":Infinity,
                    "adIntervel":0,
                    "lastDisplayed":0,
                    "showticker":true
                  },
                  {
                    "adId":"LOCAL_TRIBE_AD_1",
                    "adPriority":"LOW",
                    "adName":"LOCAL_TRIBE_AD_1",
                    "adUrl":"images/localtribe_ad_1.png",
                    "adMimeType":"image/png",
                    "adTime":"10",
                    "adCount":Infinity,
                    "adIntervel":300,
                    "lastDisplayed":0,
                    "showticker":false
                  }

            ];
*/          $scope.advert =[];  
               $scope.advert = config;
               console.log($scope.advert);


            $scope.advertisements =[];
            

            
            $scope.advertisement={};
            $scope.doctors = [];
            $scope.doctor={};
            $scope.flashBus={};
            $scope.flashQueue=[];
            $scope.insideflash=false;
            $scope.device_doctors_map=[];

//////////////////////////////////////slack Call//////////////
            function post_log_on_slack(logtobeposted){
        
        console.log("posting on slack: "+JSON.stringify(logtobeposted));
        
        var slack_post_ip="52.76.159.84";
        var slack_post_port="8091";
        $.ajax({
                    type: 'POST',
                    url: "http://"+slack_post_ip+":"+slack_post_port+"/qlive/connection_test/v0.0.1/connect_disconnect",
                    dataType: "json",
                    data: JSON.stringify(logtobeposted),
                    contentType: 'application/json; charset=UTF-8',
                    //crossDomain: true,
                    success: function (msg) {
                        
                    },
                    error: function (request, status, error) {

                    }

            });     


    }

            function sender_is_connected(event){
                var clinic_name_for_log="";
                var doctor_name_for_log="";
                var number_of_connected_devices=window.castReceiverManager.getSenders().length;
                  for(var d_d_m=0;d_d_m<$scope.device_doctors_map.length;d_d_m++){
                    if($scope.device_doctors_map[d_d_m].senderId===event.senderId){
                        var doc_id_to_be_searched=$scope.device_doctors_map[d_d_m].doctorID;
                        for(var doc_index=0;doc_index<$scope.doctors.length;doc_index++){
                            if($scope.doctors[doc_index].header.doctorID===doc_id_to_be_searched){
                                doctor_name_for_log=doctor_name_for_log+","+$scope.doctors[doc_index].header.doctorName;
                                clinic_name_for_log=$scope.doctors[doc_index].header.cinicName;
                                //break;
                            }
                        }
                    }
                    }
                  var logtobeposted={
                    type:"connection",
                    clinicName:clinic_name_for_log,
                    doctorName:doctor_name_for_log,
                    connectedSenders:number_of_connected_devices,
                    event:event,
                    channel:"#qlive_connection_test"
                }
                    post_log_on_slack(logtobeposted)
            }
            function sender_is_disconnected(event){
                 var clinic_name_for_log="";
      var doctor_name_for_log="";
      var number_of_connected_devices=window.castReceiverManager.getSenders().length;
      if(event.reason == cast.receiver.system.DisconnectReason.REQUESTED_BY_SENDER){
        for(var d_d_m=0;d_d_m<$scope.device_doctors_map.length;d_d_m++){
            if($scope.device_doctors_map[d_d_m].senderId===event.senderId){
                var empty_queue={
                    header:{
                        doctorID:$scope.device_doctors_map[d_d_m].doctorID,
                    },
                    body:{
                        queue:[]
                    }
        
                }
                
                $scope.add_if_not_present(empty_queue);
                //$scope.callback(data_for_queue);
                
                //recently_received_queue_data.push(empty_queue);
                var doc_id_to_be_searched=$scope.device_doctors_map[d_d_m].doctorID;
                for(var doc_index=0;doc_index<$scope.doctors.length;doc_index++){
                    if($scope.doctors[doc_index].header.doctorID===doc_id_to_be_searched){
                        doctor_name_for_log=doctor_name_for_log+","+$scope.doctors[doc_index].header.doctorName;
                        clinic_name_for_log=$scope.doctors[doc_index].header.cinicName;
                        $scope.doctors[doc_index].body.queue=[];
                        break;
                    }
                }
                
            }
        }
      }
      var logtobeposted={
        type:"disconnect",
        clinicName:clinic_name_for_log,
        doctorName:doctor_name_for_log,
        connectedSenders:number_of_connected_devices,
        event:event,
        channel:"#qlive_connection_test"
    }
      post_log_on_slack(logtobeposted)
          if (window.castReceiverManager.getSenders().length == 0&&event.reason == cast.receiver.system.DisconnectReason.REQUESTED_BY_SENDER) {
        setTimeout(window.close,5000);
          }
            }


            function populate_device_doctormap(event){
                var received_queue=JSON.parse(event.data)
                var device_with_doctor={
                senderId:event.senderId,
                doctorID:received_queue.header.doctorID
                }
                var device_found=false;
                for(var d_w_d=0;d_w_d< $scope.device_doctors_map.length;d_w_d++){
                    if($scope.device_doctors_map[d_w_d].doctorID===device_with_doctor.doctorID&&$scope.device_doctors_map[d_w_d].senderId===device_with_doctor.senderId){
                        device_found=true;
                    }
                }
                if(device_found==false){
                    $scope.device_doctors_map.push(device_with_doctor);
                }
            }


            //Google cast callback
            $scope.callback = function(data) {
                switch (data.dataType) {
                    case 'flashBus':
                        var flashdata = JSON.parse(data.data);
                        //$scope.flashQueue.push(flashdata);//
                        pushIfNotPresent(flashdata);
                        if(!$scope.insideflash){
                            showFlash(0);
                        }
                        break;
                        //Add patient update    
                    case 'queueBus':
                        $scope.add_if_not_present(JSON.parse(data.event.data));
                        populate_device_doctormap(data.event);
                        break;
                    case 'advertisementBus':
                        $scope.advertisementBus = data;
                        break;
                    case 'controlBus':
                        $scope.controlBus = data;
                        break;
                    case 'connected':
                        sender_is_connected(data.data)
                        break;
                    case 'disconnected':
                        sender_is_disconnected(data.data)
                        break;

                }
                $scope.$apply();
            };
            CastReceiver.initialize($scope.callback);


            //------------------filter Queue Logic

            /*********queue types**********/
            var QUEUE_TYPE_SCAN = 1001;
            var QUEUE_TYPE_ASSIST = 1002;
            var QUEUE_TYPE_DOCTOR = 1003;
            var QUEUE_TYPE_PROCESSED = 1004;
            //*********queue types end**********//

            //*********type of appointment********//    
            var fromWalkinQ = 136932;
            var fromChekinQ = 132432;
            //*********type of appointment end********//

            //******patient status******//
            var STATUS_DONE = 101;
            var STATUS_ABANDON = 102;
            var STATUS_REMOVED = 103;
            var STATUS_IN_QUEUE = 104;
            $scope.filtered_queue = [];

            /*filter data of patient and doctor when update received*/

            $scope.add_if_not_present = function(data) {
                var already_present = false;
                var filtered_queue = filter_patients_in_queue(data.body.queue);
                data.body.queue = filtered_queue;
                for (var i = 0; i < $scope.doctors.length; i++) {
                    if (data.header.doctorID === $scope.doctors[i].header.doctorID) {
                        already_present = true;
                        $scope.doctors[i].body = data.body;
                        break;
                    }

                }
                if (!already_present) {
                    $scope.doctors.push(data);
                }
            };

            //function to get all the patients who are in type of QUEUE_TYPE_DOCTOR, QUEUE_TYPE_ASSIST and have status of STATUS_IN_QUEUE

            function filter_patients_in_queue(queue) {
                var filtered_queue = [];
                if (!queue)
                    return filtered_queue;

                for (var patient_number = 0; patient_number < queue.length; patient_number++) {
                    if (queue[patient_number].typeOfQueue === QUEUE_TYPE_DOCTOR || queue[patient_number].typeOfQueue === QUEUE_TYPE_ASSIST) {
                        if (queue[patient_number].status === STATUS_IN_QUEUE) {
                            filtered_queue.push(queue[patient_number]);
                        }
                    }
                }
                return filtered_queue;
            }

            /* end Filter Queue logic*/
            
            /****added for maintaining advertisement pointer****/
            var currentIndexForAd = -1;

            var currentIndexForDoc = -1;

            /****added for maintaadvertisement****/
            function nextDoc() {
               currentIndexForDoc=currentIndexForDoc < $scope.doctors.length-1 ?currentIndexForDoc+1:  0;
            }
             function nextAd() {
                currentIndexForAd=currentIndexForAd < $scope.advertisements.length-1 ?currentIndexForAd+1 : 0;
            }
            
            //buisness logic to show screens 
            $scope.docVisible=false;
            $scope.advVisible=false;
            $scope.flashVisible=false;
            
            function showDoc(){
                $scope.doctor={};
                $scope.doctor= $scope.doctors[currentIndexForDoc];
                $scope.advVisible=false;
                $scope.flashVisible=false;  
                $scope.docVisible=true;
            }
            function showAdv(){
                $scope.advertisement={};
                $scope.advertisement= $scope.advertisements[currentIndexForAd];
                $scope.docVisible=false;
                $scope.flashVisible=false;
                $scope.advVisible=true;
            }
            



            
            
            function pushIfNotPresent(received_flash_msg){
                var already_present=false;
                for(var i=0;i<$scope.flashQueue.length;i++){
                    if(received_flash_msg.header.doctorID===$scope.flashQueue[i].header.doctorID&&received_flash_msg.body.patientid===$scope.flashQueue[i].body.patientid){
                already_present=true;
                break;
            }
        
                }
                if(!already_present){
                    $scope.flashQueue.push(received_flash_msg);
                }
                        
                    }
                    
            
            
            function showFlash(flashindex)
                {   
                    
                    
                    $scope.insideflash=true;
                    $scope.docVisible=false;
                    $scope.advVisible=false;
                    $scope.flashVisible=true;
                    stopCountDown();
                        if($scope.flashQueue.length<=0){
                            $scope.insideflash=false;
                             $timeout(function(){
                                if($scope.counter<=10)
                                    showAdv();
                                    
                                else if($scope.counter<=30){
                                    showDoc();
                                    }
                                    countDown();
                                    },0);
                            //come out of breaking news
                        }
                        else if(flashindex>=$scope.flashQueue.length){
                            $scope.flashQueue=[];
                            $scope.insideflash=false;
                            $timeout(function(){
                                if($scope.counter<=10)
                                    showAdv();
                                    
                                else if($scope.counter<=30){
                                    showDoc();
                                    }
                                    countDown();
                                    },0);
                            //come out of breaking news
                        }
                        else{
                            $scope.flashBus=$scope.flashQueue[flashindex];
                            $timeout(function(){
                                    showFlash(++flashindex)
                                    },6000);
                        }
                                    
                    }
                   
                
               
           
            
            
            // var TIMER_ADV = 10;
            // var TIMER_DOC= 20;
            // var TIMER_FLASH = 6000;
            $scope.counter=0;
            var stopped
            function stopCountDown(){
                $timeout.cancel(stopped);
            }
            function countDown(){
                stopped=$timeout(function(){
                    if($scope.counter===0){
                        nextAd(); 
                        showAdv();
                    }else if($scope.counter===10){
                        nextDoc(); 
                        showDoc();
                    }else if($scope.counter===30){
                        $scope.counter=-1;
                    }
                    $scope.counter+=1;
                    countDown();
                },1000);
            }
            
            nextAd();
            showAdv();
            $scope.counter+=1;
            countDown();
            
        }
    ])

///reciver code ............................
.service('CastReceiver', function() {
    this.initialize = function(callback) {
        cast.receiver.logger.setLevelValue(0);
        function post_log_on_slack(logtobeposted){
        
        console.log("posting on slack: "+JSON.stringify(logtobeposted));
        
        var slack_post_ip="52.76.159.84";
        var slack_post_port="8091";
        $.ajax({
                    type: 'POST',
                    url: "http://"+slack_post_ip+":"+slack_post_port+"/qlive/connection_test/v0.0.1/connect_disconnect",
                    dataType: "json",
                    data: JSON.stringify(logtobeposted),
                    contentType: 'application/json; charset=UTF-8',
                    //crossDomain: true,
                    success: function (msg) {
                        
                    },
                    error: function (request, status, error) {

                    }

            });     


    }
        window.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();

        console.log('Starting Receiver Manager');

        // handler for the 'ready' event
        castReceiverManager.onReady = function(event) {
            console.log('Received Ready event: ' + JSON.stringify(event.data));
            window.castReceiverManager.setApplicationState("Application status is ready...");
        };

        // handler for 'senderconnected' event
        castReceiverManager.onSenderConnected = function(event) {
            console.log('Received Sender Connected event 22: ' + event.data);
            console.log(window.castReceiverManager.getSender(event.data).userAgent);
            callback({
                    dataType: 'connected',
                    data: event
                });
            
        };

        // handler for 'senderdisconnected' event
        castReceiverManager.onSenderDisconnected = function(event) {
            console.log('Received Sender Disconnected event: ' + event.data);
            
                callback({
                    dataType: 'disconnected',
                    data: event
                });
            
        };

        // handler for 'systemvolumechanged' event
        castReceiverManager.onSystemVolumeChanged = function(event) {
            console.log('Received System Volume Changed event: ' + event.data['level'] + ' ' +
                event.data['muted']);
        };


        window.queueBus = window.castReceiverManager.getCastMessageBus('urn:x-cast:com.qorql.qlive.queuebus');

        window.queueBus.onMessage = function(event) {
            console.log('Message [' + event.senderId + ']: ' + event.data);
            /**/

            // display the message from the sender
            callback({
                    dataType: 'queueBus',
                    
                    event:event
                });
            // inform all senders on the CastMessageBus of the incoming message event
            // sender message listener will be invoked
            window.queueBus.send(event.senderId, event.data);
        };


        window.flashBus = window.castReceiverManager.getCastMessageBus('urn:x-cast:com.qorql.qlive.flashbus');

        window.flashBus.onMessage = function(event) {
            console.log('Message [' + event.senderId + ']: ' + event.data);
            // display the message from the sender
            callback({
                    dataType: 'flashBus',
                    data: event.data
                });
            // inform all senders on the CastMessageBus of the incoming message event
            // sender message listener will be invoked
            window.flashBus.send(event.senderId, event.data);
        };


        window.advertisementBus = window.castReceiverManager.getCastMessageBus('urn:x-cast:com.qorql.qlive.adbus');

        window.advertisementBus.onMessage = function(event) {
            console.log('Message [' + event.senderId + ']: ' + event.data);
            // display the message from the sender
            callback({
                    dataType: 'advertisementBus',
                    data: event.data
                });
            // inform all senders on the CastMessageBus of the incoming message event
            // sender message listener will be invoked
            window.advertisementBus.send(event.senderId, event.data);
        };

        window.controlBus = window.castReceiverManager.getCastMessageBus('urn:x-cast:com.qorql.qlive.controlbus');

        window.controlBus.onMessage = function(event) {
            console.log('Message [' + event.senderId + ']: ' + event.data);
            // display the message from the sender
            callback({
                    dataType: 'controlBus',
                    data: event.data
                });
            // inform all senders on the CastMessageBus of the incoming message event
            // sender message listener will be invoked
            window.controlBus.send(event.senderId, event.data);
        };

        // initialize the CastReceiverManager with an application status message
        window.castReceiverManager.start({
                statusText: "Application is starting"
            });
        console.log('Receiver Manager started');
    }
});