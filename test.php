<?php
date_default_timezone_set('Europe/Ulyanovsk');
$date = htmlspecialchars($_POST["date"]);
if ($date==0){
    $date = date('Y-m-d');
} else{
    $parts_date = explode("-",$date);
    if ($parts_date[1]<10) $parts_date[1] = "0{$parts_date[1]}";
    if ($parts_date[2]<10) $parts_date[2] = "0{$parts_date[2]}";
    $date = "$parts_date[0]-$parts_date[1]-$parts_date[2]";
}

$group ='АИСТбд-31';
$mysqlis = new mysqli("95.104.192.212", "vlad", "pXYMvrx8xILHDPxd", "raspisanie");
    if (!$mysqlis->set_charset("utf8")) {
    printf("Ошибка при загрузке набора символов utf8: %s\n", $mysqlis->error);
    exit();
    } 
if (mysqli_connect_errno()) { 
    printf("Подключение невозможно: %s\n", mysqli_connect_error()); 
    exit(); 
} 
    
   if ($stmt = $mysqlis->prepare("SELECT timeStart, timeStop, discipline, type,teacher, cabinet, subgroup FROM `timetable` WHERE `class`='{$group}' AND `date`='{$date}' AND `subgroup`!=2")) { 
    $stmt->execute(); 
    $stmt->bind_result($col1,$col2,$col3,$col4,$col5,$col6,$col7);
    $num = 1;
    while ($stmt->fetch()) { 
        $col1 = normal($col1);
        $col2 = normal($col2);
        $temp ="$temp\n\n$num)С $col1 до $col2\n$col3\nАудитория: [$col6];\nПодгруппа: [$col7];\nУчитель: [$col5];\n[{$col4}];";
        $num++;
    } 
    $stmt->close(); 
    
    }   
    if ($temp==null){
        $temp = "Сегодня у вас нет пар. Отдыхайте!";
    } else {
        $num--;
        $temp = "Количество пар $num на $parts_date[2]-$parts_date[1] число\n$temp"; 
    }
$mysqlis->close();  
$fin_json = json_encode($temp);
echo $fin_json;

function normal($times){
    $parts = explode(":",$times);
    return "$parts[0]:$parts[1]";
} //Убираем секунды из строки