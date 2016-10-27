1、cookie.js的程序包装主要采用的是匿名函数自执行的方式，同时为其内部提供了两个参数。基本形式如下：
!function(document, undefined){...}(typeof document === 'undefined' ? null : document);
这个简单的入口构造，我们可以get以下几个问题：
①：匿名函数自执行的方式
熟悉javascript的同学，对匿名函数一定不会陌生。但是匿名函数到底有多少种书写方式呢？
最常见的大概有一下三种：
var fn = function(){}();
(function(){}())
(function(){})()
而cookie.js则采用的是如下形式：
!function(){}
和这个相似的还有下面这种形式：
~function(){}
在这两中形式里面，!和~的作用是什么。如果我们尝试吧这两个运算符去掉。我们会得到如下错误：'Uncaught SyntaxError: Unexpected token ('
具体原因其实很简单，那是因为在这两种情况下，js解析器会试图将function关键字解析成函数声明的语句，而非函数定义表达式。而我们在function的前面加上!和~运算符的时候，这些运算符会将function以及
后面的语句看做是一个整体。先对匿名函数进行求值，然后进行运算，故而达到我们所看到的匿名函数自执行的结果。
但是，但是，但是....这两种形式是存在副作用的。不行你试着运行如下的两个函数看一下结果
!function(){return true}()  //false
~function(){return true}()  // -1
②：两个参数的主要作用
我们可以看到，在函数调用的时候，向第一个参数传递了typeof document === 'undefined' ? null : document。document在浏览器里面就是我们所熟悉的文档对象模型，而javascript的另一个运行环境
nodejs则不存在这个文档对象模型，所以这个实参主要是用于，如果cookie.js运行在nodejs环境里，那么document则设置为默认的null。
或许有的人会问，为什么我们不能直接判断document的值为undefined呢？干嘛要使用typeof？这是因为在nodejs中，document相当于一个未被声明的变量，如果我们直接使用会报错的。typeof对于未声明的变量的返回值是
undefined而不会报错。
同时也为我们我们提供了一种判断javascript运行环境的一种简便的方式。
即判断一下tyepof document是否为undefined，是则说明运行环境是nodejs，反之说明运行环境是浏览器。
那么第二个形参为undefined，而实参却没有传递，这又是为什么，相信了解jquery源码的同学应该有种似曾相识的感觉，不错，就是因为undefined在某些情况下是可以被重新赋值的，这样做，就会保证匿名
函数内部的undefined的值永远是undefined。
下面就简单的总结一下，到底在什么样的情况下，undefined是可以被重写的？
①：根据MDN里面的描述，在es3之前，window.undefined就是一个普通的属性，我们完全可以把它的值改成任意我们想要的值。在es5之后，window.undefined的值就变成了不可写且是不可配置的属性
②：在现在标准浏览器里面，包括最新版本的chrome。当我们为window.undefined赋值的时候，不会报错，但是会默默地失败。然而当undefined作为一个普通对象的属性的是，我们是可以赋值成功的。如：
var o = {}; o.undefined = 123; console.log(o.undefined); //123
③：在函数的内部，undefined可以作为局部变量而被赋值成功。
function fn(){let undefined = 1; console.log(undefined); //1}
④：也就是我们上面看到的形式，因为在IE8以下的浏览器，会出现这种情况：
undefined = 2;
(function(){alert(undefined)})() //2
采用上面的写法就能避免了
