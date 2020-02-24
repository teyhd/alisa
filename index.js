var express = require('express');
var app = express();
var request = require('request');
var rp = require('request-promise');
var fs = require('fs');
var Client = require('ssh2').Client;
var io = require('socket.io');
var key = fs.readFileSync('encryption/private.key');
var cert = fs.readFileSync('encryption/primary.crt');
var ca = fs.readFileSync('encryption/intermediate.crt');
var options = {
    key: key,
    cert: cert,
    ca: ca
};
var app = require('express')();
var https = require('https');
var server = https.createServer(options, app);
//var server = https.createServer(app);
var io = require('socket.io').listen(server);
server.listen(1883); console.log("Навык запущен");

var coffSin = ["кофе","чай","чаю","чайку","чаечек"];
var offSin = ["выключи","оффни"];
var raspsin = ["расписание","пары","пара","фары"];
var rebsin = ["перезагрузи"];
var slesin = ["сон"];
var comp=["компьютер","пк","комп"];
var labtop = ["ноутбук","ноут"];
var serv = ["сервер"];
var calend = ["календарь"];
var coffedev = ["кофеварку"];

app.use(express.json());
var resA,reqA;
app.post('/', function (req, res) {
    resA=res;reqA=req;
    console.log(req.body.request);
    console.log(req.body.request.nlu.tokens);
    console.log(req.body.request.nlu.entities);
    if (!speech(req.body.request.command)){
        if(!brain(req.body.request.nlu.tokens)){
            ans("Я такого не знаю \nСпроси 'Что ты умеешь?'");
        }
    }
    
    //ans(req.body.request.command);

});

app.use('*', function (req, res) {
  res.sendStatus(404);
});

function speech(stext){
    let answered = false;
    switch (stext) {
         case '':
            ans("Привет!\nПроект умной комнаты! \nВнимание навык является приватным! \nЕсли вы являетесь модератором задайте вопрос 'Что ты умеешь?'");
            answered = true;
        break;
        case 'Что ты умеешь?':
        case 'что ты умеешь':
            ans("Управлять умной комнатой.\nОтправлять запросы на raspberry pi 3.\nРасскажу пары на завтра, но не ваши");
            answered = true;
        break;
        case 'спасибо':
            ans("Обращайтесь");
            answered = true;
            break;
    }
    return answered;
}
function brain(gtok){
     for(let i=0;i<coffSin.length;i++){
         if (gtok.includes(coffSin[i])){
             coffee(1);
             return 1;
         } //Кофе 
     }
     for(let i=0;i<offSin.length;i++){
         if (gtok.includes(offSin[i])) {
             get_dev_off(gtok);
             return 2; //Выключение
         }
     }
     for(let i=0;i<raspsin.length;i++){
         if (gtok.includes(raspsin[i])) {
             rasp_get_date();
             return 3;
         }
     }
     for(let i=0;i<rebsin.length;i++){
         if (gtok.includes(rebsin[i])) {
             get_dev_reb(gtok);
             return 4;
         }
     }
     for(let i=0;i<slesin.length;i++){
         if (gtok.includes(slesin[i])){
             get_dev_sleep(gtok);
             return 5;
         } 
     }

     return false;
}
function ans(atex){
    resA.json({
      version: reqA.body.version,
      session: reqA.body.session,
        response: {
          text: atex,
          //tts: "<speaker audio=\"alice-sounds-game-win-1.opus\"> "+atex,
          end_session: false,
        },
    })
}
function send_weather() {
    let ans=null;
    try {
        request.post({ url: 'http://localhost/alisa/test.php', form: { q: '88' } }, function(err, httpResponse, body) {
          //  console.log(body);
            if (body != undefined) {
            
                console.log(ans);
                return ans;
            } else send_weather();
        })
    } catch (e) {
        console.log(e);
    }
} 

function rasp_get_date(){
    var now = new Date();
    var day = now.getDate();
    var month = now.getMonth()+1;
    if (month < 10) month="0"+month;
    if (day < 10) day="0"+day;
    var year = now.getFullYear();

    var ans_date = 0;
    
    console.log(reqA.body.request.nlu.tokens);
    
    if (reqA.body.request.nlu.tokens.length<2) ans_date = 0;
    if (reqA.body.request.nlu.tokens.includes("сегодня")) ans_date = 0;
    if (reqA.body.request.nlu.tokens.includes("завтра")){
        now.setDate(day+1);
        var day = now.getDate();
        if (day < 10) day="0"+day;
        ans_date = `${year}-${month}-${day}`;
    } 
    try {
        if (reqA.body.request.nlu.entities[1].value.day!=undefined){
        day = reqA.body.request.nlu.entities[1].value.day;
        if (day < 10) day="0"+day;
        ans_date = `${year}-${month}-${day}`;
    }
    } catch (e) {}
    try {
        if (reqA.body.request.nlu.entities[1].value.month!=undefined){
    month = reqA.body.request.nlu.entities[1].value.month;
    if (month < 10) month="0"+month;
    ans_date = `${year}-${month}-${day}`;
    }
    } catch (e) {}
    
    console.log(ans_date);
    rasp(ans_date);
}
function rasp(par){
    var options = {
    method: 'POST',
    uri: 'http://localhost/alisa/test.php',
    form: {
        date: par
    },
    headers: {
        /* 'content-type': 'application/x-www-form-urlencoded' */ // Is set automatically
    }
};
 
rp(options)
    .then(function (body) {
        let answ="";
            body = JSON.parse(body);
            console.log(body);
            answ=body;
                ans(answ);
    })
    .catch(function (err) {
        ans("Произошла ошибка получения пар");
    });
    
    //return answ;
}

//https://teyhd.ru/alisa/test.php
//http://localhost/weather.php
function coffee(par){
    let cmd = null;
    if (par==1){
        cmd = 'echo p 18 255 > /dev/pigpio';
        setTimeout(coffee, 1000*60*10,0);
        ans("Напиток скоро будет готов!");
        console.log("Кофеварка включена");
    } else {
        cmd = 'echo p 18 0 > /dev/pigpio';
        console.log("Кофеварка выключена");
    }
    let conn = new Client();
conn.on('ready', function() {
  conn.exec(cmd, function(err, stream) {
    if (err) throw err;
    stream.on('close', function(code, signal) {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', function(data) {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', function(data) {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: '192.168.0.103',
  port: 22,
  username: 'root',
  password: '258000'
});
 
}

function get_dev_off(par){
     for(let i=0;i<comp.length;i++){
         if (par.includes(comp[i])) {
             off_dev(1);
         }
     }
      for(let i=0;i<serv.length;i++){
         if (par.includes(serv[i])) {
             off_dev(2);
         }
     }
      for(let i=0;i<calend.length;i++){
         if (par.includes(calend[i])) {
             off_dev(3);
         }
     }
       for(let i=0;i<labtop.length;i++){
         if (par.includes(labtop[i])) {
             off_dev(4);
         }
     }  
      for(let i=0;i<coffedev.length;i++){
         if (par.includes(coffedev[i])) {
             off_dev(5);
         }
     } 
}
function off_dev(par){
  let hostp = '192.168.0.103';
  let usernamep = 'root';
  let passwordp = '258000';
    let cmd = null;
    switch (par) {
        case 1://комп
        hostp = '192.168.0.104';
        usernamep = "spiderman201010@mail.ru";
        passwordp = "Vlad281000";
        cmd = 'shutdown -s -t 0';
        ans("Ваш компьютер скоро выключится!!");
        break;
         case 2://сервер
        hostp = '192.168.0.107';
        cmd = 'init 0';
        ans("Ваш сервер скоро выключится!!");
        break;
         case 3://календарь
        cmd = 'init 0';
        ans("Ваш календарь скоро выключится!!");
        break;
        case 4://ноутбук
        hostp = '192.168.0.106';
        usernamep = "spiderman201010@mail.ru";
        passwordp = "Vlad281000";
        cmd = 'shutdown -s -t 0';
        ans("Ваш ноутбук скоро выключится!!");
        break;
        case 5://ноутбук
        hostp = '192.168.0.107';
        cmd = 'ls';
        coffee(0);
        break;
        
        default:
            ans("Такого устройства нет");
    }

let conn = new Client();
conn.on('ready', function() {
  conn.exec(cmd, function(err, stream) {
    if (err) throw err;
    stream.on('close', function(code, signal) {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', function(data) {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', function(data) {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: hostp,
  port: 22,
  username: usernamep,
  password: passwordp
});
 
}

function get_dev_reb(par){
     for(let i=0;i<comp.length;i++){
         if (par.includes(comp[i])) {
             reb_dev(1);
         }
     }
      for(let i=0;i<serv.length;i++){
         if (par.includes(serv[i])) {
             reb_dev(2);
         }
     }
      for(let i=0;i<calend.length;i++){
         if (par.includes(calend[i])) {
             reb_dev(3);
         }
     }
       for(let i=0;i<labtop.length;i++){
         if (par.includes(labtop[i])) {
             reb_dev(4);
         }
     }     
}
function reb_dev(par){
  let hostp = '192.168.0.103';
  let usernamep = 'root';
  let passwordp = '258000';
    let cmd = null;
    switch (par) {
        case 1://комп
        hostp = '192.168.0.104';
        usernamep = "spiderman201010@mail.ru";
        passwordp = "Vlad281000";
        cmd = 'shutdown -r';
        ans("Ваш компьютер скоро перезагрузится!!");
        break;
         case 2://сервер
        hostp = '192.168.0.107';
        cmd = 'init 6';
        ans("Ваш сервер скоро перезагрузится!!");
        break;
         case 3://календарь
        cmd = 'init 6';
        ans("Ваш календарь скоро перезагрузится!!");
        break;
        case 4://ноутбук
        hostp = '192.168.0.106';
        usernamep = "spiderman201010@mail.ru";
        passwordp = "Vlad281000";
        cmd = 'shutdown -r';
        ans("Ваш ноутбук скоро перезагрузится!!");
        break;
        
        default:
            ans("Такого устройства нет");
    }

let conn = new Client();
conn.on('ready', function() {
  conn.exec(cmd, function(err, stream) {
    if (err) throw err;
    stream.on('close', function(code, signal) {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', function(data) {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', function(data) {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: hostp,
  port: 22,
  username: usernamep,
  password: passwordp
});
 
}

function get_dev_sleep(par){
     for(let i=0;i<comp.length;i++){
         if (par.includes(comp[i])) {
             sleep_dev(1);
         }
     }
      for(let i=0;i<serv.length;i++){
         if (par.includes(serv[i])) {
             sleep_dev(2);
         }
     }
      for(let i=0;i<calend.length;i++){
         if (par.includes(calend[i])) {
             sleep_dev(3);
         }
     }
       for(let i=0;i<labtop.length;i++){
         if (par.includes(labtop[i])) {
             sleep_dev(4);
         }
     }     
}
function sleep_dev(par){
  let hostp = '192.168.0.103';
  let usernamep = 'root';
  let passwordp = '258000';
    let cmd = null;
    switch (par) {
        case 1://комп
        hostp = '192.168.0.104';
        usernamep = "spiderman201010@mail.ru";
        passwordp = "Vlad281000";
        cmd = 'shutdown -h';
        ans("Ваш компьютер скоро уснет!!");
        break;
         case 2://сервер
        hostp = '192.168.0.107';
        cmd = 'ls';
        ans("Устройство не поддерживает сон");
        break;
         case 3://календарь
        cmd = 'ls';
        ans("Устройство не поддерживает сон");
        break;
        case 4://ноутбук
        hostp = '192.168.0.106';
        usernamep = "spiderman201010@mail.ru";
        passwordp = "Vlad281000";
        cmd = 'shutdown -h';
        ans("Ваш ноутбук скоро уснет!!");
        break;
        
        default:
            ans("Такого устройства нет");
    }

let conn = new Client();
conn.on('ready', function() {
  conn.exec(cmd, function(err, stream) {
    if (err) throw err;
    stream.on('close', function(code, signal) {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', function(data) {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', function(data) {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: hostp,
  port: 22,
  username: usernamep,
  password: passwordp
});
 
}
