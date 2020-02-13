# LYRIC-EDITOR-APP

Lyric editing, using cli.

(TODO: 🚧 Document in English is under constructing.)

（注意：这一文档正在编辑中，内容可能不完整）

（注意：程序仍处在开发状态）

## 命令

命令系统是LYRIC-EDITOR-APP的核心，通过命令，用户可以让程序完成一项操作。

### 命令调用格式

```
命令名 参数1 参数2 参数3 ...
```

可以通过`commands`命令查看命令列表。

### 参数类型格式

 - 字符串：`"string"` `'string'` <code>&#x60;string&#x60;</code>
    （注意：即使是在双引号中输入单引号，或者在反引号中输入双引号等，也应该使用转义字符。）

 - 数值：例如`1` `2` `3` `0x1b`

 - HMS格式的时间：`[hr:min:sec.ms]`，例如`[04:12.5]` `[3:5.20]`。如果省略某一项，则这一项默认为`0`。

 - 小节节拍格式的时间：`(1:3)` `(13:5.8)`

 - 布尔型：`true` `false`

 - 调用变量：`变量名`，例如：`x` `y`。（使用`set`等命令可以设定变量的值。）

### 命令列表

#### `alter`

更改某一行的歌词。

```
alter <行号：数值> [时间：HMS时间|节拍时间] [歌词：字符串]
```

```
alter <行号：数值> [歌词：字符串] [时间：HMS时间|节拍时间]
```

例如：

```
alter 4 [4.8] "可否记得这夜色中"
```

#### `beatOption`

设定小节节拍时间的选项。

```
beatOption <设置项："bpm"|"beat"|"subdiv"> <值：数值>
```

例如：

```
beatOption 'bpm' 120
```

#### `clone`

复制一段歌词。

```
clone <区间起点：数值> <区间终点：数值> <目的地行号：数值>
```

区间使用闭区间，将会复制到目的地所在行之后。如果目的地行号为`0`，则会复制到开头。

例如：

```
clone 3 5 12
```

#### `close`

关闭当前正在编辑的文件。

没有参数。

#### `close!`

强行关闭当前正在编辑的文件。

没有参数。

#### `commands`

显示命令列表。

没有参数。

#### `delete`

删除一个变量。

```
delete <变量名：字符串>
```

#### `exit`

退出程序。

没有参数。

#### `exit!`

强行退出程序。

没有参数。

#### `getDurationOf`

获取指定行的歌词时长，存入一个指定的变量。

```
getDurationOf <变量名：字符串> <行号：数值>
```

#### `getTextOf`

获取指定行的歌词，存入一个指定的变量。

```
getTextOf <变量名：字符串> <行号：数值>
```

#### `help`

显示帮助信息。

```
help
```

```
help <命令名：字符串>
```

#### `insertAfter`

在指定行之后插入歌词。

```
insertAfter <行号：字符串> <时间：HMS时间|节拍时间> <歌词：字符串>
```

#### `list`

列出歌词。

```
list <range_left:number> [options:string]
list <range_left:number> <range_right:number> [options:string]
list <options:string> <range_left:number> [range_right:number]
```

其中，选项包含：

|Flag|Description|
|-|-|
|`t`|使用absolute time。|
|`b`|使用节拍时间。|

例如：

`list 1 10 'tb'`会用absolute节拍时间列出第一行到第十行的歌词，`list 12 't'`会用absolute HMS时间列出12行及其之后的全部歌词。

#### `move`

移动一段歌词到指定的行之后。

```
move <rangeLeft:number> <rangeRight:number> <destination:number>
```

#### `open`

打开文件。

```
open <文件名：字符串>
```
#### `pop`

删除最后一句歌词。

没有参数。

#### `print`

向stdout打印一段内容。

```
print <参数：任何> ...
```

例如：

```
print 1 'abc' [4.8] true
```

#### `push`

向末尾添加一句歌词。

```
push <duration:HMSTime|BeatTime> <lyric:string>
```

#### `redo`

重做撤销的命令。

没有参数。

#### `remove`

删除一段歌词。

```
remove <区间起点：数值> [区间终点：数值]
```

#### `save`

保存或者另存为当前工作。

```
save [另存为目录：字符串]
```

#### `set`

声明一个变量或者设置变量的值

```
set <变量名：字符串> <值：任何>
```

#### `steps`

显示历史记录栈中的所有步骤。

没有参数

输出的项目前有`-`符号的步骤在可撤销栈中，有`+`符号的步骤在可重做栈中。

#### `undo`

撤销上一步操作。

没有参数。

#### `variables`

列出变量列表。

没有参数。

#### `watcher`

指定观察器模式的选项。

```
watcher <options:string>
```

其中，选项包含：

|Flag|Description|
|-|-|
|`t`|使用absolute time。|
|`b`|使用节拍时间。|

## 观察器模式

如果您的终端程序支持拆分终端，多终端模式或者正在支持多窗口的桌面平台上使用终端，那么就可以在一个页面上运行主程序进行编译，另一个页面上运行观察器来实时显示歌词内容。

在启动程序时，添加`--watcher`参数即可进入观察器模式。

在您进行编辑时，观察器中的内容会自动更新。

注意：如果您的终端支持页面滚动，请确保在观察器中您将页面滚动到了最底端。

## 配置项

默认的配置项存储在用户目录下的`.lrc_edit`文件夹中的`config.json`文件里。在启动程序时可以通过`--config-dir`参数来override默认路径。

如果配置项存储的目录不存在，那么程序会自动创建目录和包含默认配置的配置文件。

在启动程序时添加`--reset-config`可以重置配置项。

### `numWidth`

参见[time-beat-format](https://github.com/HyperbolaStudio/time-beat-format#option)中`numberWidthOption`的选项。

### `general`

一些通用配置项。

|项目|描述|
|-|-|
|`endLine`|行尾序列，默认为LF（`\n`），可以根据需要修改为CRLF（`\r\n`）。|
|`enableTTYColor`|在终端输出的文字是否显示颜色。|
|`showWelcomeMessage`|是否在程序启动时显示欢迎信息。|
|`TTYPrompt`|命令的提示符。默认为`>`|

## 从文件/入参/stdin中读取命令

使用`--exec <command>`参数可以从入参中读取命令。

使用`--exec-file <path>`参数可以从文件中读取命令。（会在`--exec`的命令之后执行）

使用`-l <path>`或者`--load-file <path>`可以打开lrc文件。相当于使用`open`命令。

从stdin中读取命令，只需要将stdin流重定向即可。

注意：执行完这些命令后，如果没有遇到`EOF`，程序仍然会进入交互模式。如果想要执行完命令后退出程序，请在要执行的命令最后添加`exit`命令。

## 警告静默模式

在启动程序时使用`--no-warning`参数可以静默所以警告。
