// Copyright (c) 2015 Florian Hartmann, https://github.com/florian https://github.com/florian/cookie.js
/*
	cookie所使用的所有的方法都是静态方法  当直接调用cookie这个函数的时候 默认以get的方式进行处理
*/
!function (document, undefined) {

	var cookie = function () {
		/*
			这个方法其实就是cookie.get的一种简写形式
		*/
		return cookie.get.apply(cookie, arguments);
	};

	var utils = cookie.utils =  {
		/*
			cookie.js内部使用的工具方法
		*/
		// Is the given value an array? Use ES5 Array.isArray if it's available.
		isArray: Array.isArray || function (value) {
			//判断是不是数组的方法
			return Object.prototype.toString.call(value) === '[object Array]';
		},

		// Is the given value a plain object / an object whose constructor is `Object`?
		isPlainObject: function (value) {
			//判断是不是json对象的方法
			return !!value && Object.prototype.toString.call(value) === '[object Object]';
		},

		// Convert an array-like object to an array – for example `arguments`.
		toArray: function (value) {
			//将类数组转换成数组的方法
			return Array.prototype.slice.call(value);
		},

		// Get the keys of an object. Use ES5 Object.keys if it's available.
		getKeys: Object.keys || function (obj) {
      //获取对象属性的方法
			var keys = [],
				 key = '';
			for (key in obj) {
				if (obj.hasOwnProperty(key)) keys.push(key);
			}
			return keys;
		},

		// Unlike JavaScript's built-in escape functions, this method
		// only escapes characters that are not allowed in cookies.
		encode: function (value) {
			//转义函数  这个函数并不是将所有的字符都进行转义 而是将不能在cookie中存在的字符进行转义
			// 从以下的函数可以知道在cookie中不能存在的字符串主要有:,---;---"---\---=---空格---%
			return String(value).replace(/[,;"\\=\s%]/g, function (character) {
				// 这里的character就是和正则表达式匹配的部分
				return encodeURIComponent(character);
			});
		},

		decode: function (value) {
			// 对转义之后的字符进行解义
			return decodeURIComponent(value);
		},

		// Return fallback if the value is not defined, otherwise return value.
		retrieve: function (value, fallback) {
			return value == null ? fallback : value;
		}

	};

	// 设置cookie类的默认对象
	cookie.defaults = {};
	// 设置默认的过期时间的基数值--1天
	cookie.expiresMultiplier = 60 * 60 * 24;

	// 设置cookie的方法
	cookie.set = function (key, value, options) {
		/*
			这个方法是设置cookie的方法  该方法接收三个参数  第一个参数可以是对象或者是字符串  如果是对象
			则对象中的key就是cookie的name value就是cookie对应的value
		*/
		if (utils.isPlainObject(key)) {

			// `key` contains an object with keys and values for cookies, `value` contains the options object.
			/*
				如果key是一个对象的话 则第二个参数就不再表示value了  就是表示的是选项对象
			*/
			for (var k in key) {
				if (key.hasOwnProperty(k)) this.set(k, key[k], value);
			}
		} else {
			// 为options设置默认值  如果options是一个对象的话  则就取这个对象  否则就把这个对象当作是设置过期时间的值
			options = utils.isPlainObject(options) ? options : { expires: options };

			// Empty string for session cookies.
			// 这里主要是获取到expires的值 如果想要为这个传值  默认单位是天
			/*
				这里需要知道expires的来源有几种：有两种
				主要取决于optioans的数据类型  如果options是一个json对象的话  则expires是作为这个对象的一个属性存在的
				 如果options是非对象的话  则这个值就表示expires的值

				 不管怎样  这两种情况都会将expires转换成一个json对象的属性
			*/

			/*
				这个主要是获取到expires的值  从以下的表达式  可以看出expires的值的优先级是 指定的 大于 默认的  大于 空
			*/
			var expires = options.expires !== undefined ? options.expires : (this.defaults.expires || ''),
					// 获取数据类型
					expiresType = typeof(expires);
			// 针对expires是字符串的操作--这显示expires是字符串的时候  可以传入任何能够被new Date()识别的字符串
			if (expiresType === 'string' && expires !== '') expires = new Date(expires);
			// 针对expires是数字的操作--默认单位是天
			else if (expiresType === 'number') expires = new Date(+new Date + 1000 * this.expiresMultiplier * expires); // This is needed because IE does not support the `max-age` cookie attribute.
			// 这个主要是对expires进行标准化
			/*
				这里涉及到了cookie的一个基本设置选项：expires这个选项用于指定cookie的过期时间
			*/
			if (expires !== '' && 'toGMTString' in expires) expires = ';expires=' + expires.toGMTString();

			// 这里主要是设置cookie的path
			var path = options.path || this.defaults.path;
			path = path ? ';path=' + path : '';

			// 这里主要是设置cookie的domain
			var domain = options.domain || this.defaults.domain;
			domain = domain ? ';domain=' + domain : '';

			// 这里主要是设置cookie的secure
			var secure = options.secure || this.defaults.secure ? ';secure' : '';
			if (options.secure === false) secure = '';
			// 设置cookie--对值进行转义
			document.cookie = utils.encode(key) + '=' + utils.encode(value) + expires + path + domain + secure;
		}

		return this; // Return the `cookie` object to make chaining possible.
	};

	cookie.setDefault = function (key, value, options) {
		if (utils.isPlainObject(key)) {
			for (var k in key) {
				if (this.get(k) === undefined) this.set(k, key[k], value);
			}
			return cookie;
		} else {
			if (this.get(key) === undefined) return this.set.apply(this, arguments);
		}
	},

	cookie.remove = function (keys) {
		// 这里先判断一下这个参数是不是数组  是数组的刷 就可以一次性的移除多个  不是的话  就先转成数组再操作
		keys = utils.isArray(keys) ? keys : utils.toArray(arguments);

		for (var i = 0, l = keys.length; i < l; i++) {
			// 这是将cookie清除的最便捷的方法  只需要将它的过期时间设为过去的哪个时刻就行了
			this.set(keys[i], '', -1);
		}

		return this; // Return the `cookie` object to make chaining possible.
	};

	cookie.removeSpecific = function (keys, options) {
		if (!options) return this.remove(keys);

		keys = utils.isArray(keys) ? keys : [keys];
		// 同样的原理 将过期时间设置为过去的时间
		options.expire = -1;

		for (var i = 0, l = keys.length; i < l; i++) {
			this.set(keys[i], '', options);
		}

		return this; // Return the `cookie` object to make chaining possible.
	};

	cookie.empty = function () {
		// 先获取到所有的cookie
		return this.remove(utils.getKeys(this.all()));
	};

	cookie.get = function (keys, fallback) {
		var cookies = this.all();

		if (utils.isArray(keys)) {
			// 是数组的话 就同时返回多个值 是一个对象
			var result = {};

			for (var i = 0, l = keys.length; i < l; i++) {
				var value = keys[i];
				result[value] = utils.retrieve(cookies[value], fallback);
			}

			return result;
			// 返回对应的cookie
		} else return utils.retrieve(cookies[keys], fallback);
	};

	cookie.all = function () {
		// 获取所有的cookie 存在一个数组中
		if (document.cookie === '') return {};

		var cookies = document.cookie.split('; '),
		    result = {};

		for (var i = 0, l = cookies.length; i < l; i++) {
			var item = cookies[i].split('=');
			var key = utils.decode(item.shift());
			var value = utils.decode(item.join('='));
			result[key] = value;
		}

		return result;
	};

	cookie.enabled = function () {
		// navigator.cookieEnabled属性可返回一个布尔值,如果浏览器启用了 cookie,则返回true
		if (navigator.cookieEnabled) return true;
		// 调用cookie的方法  判断一下
		var ret = cookie.set('_', '_').get('_') === '_';
		cookie.remove('_');
		return ret;
	};

	// If an AMD loader is present use AMD.
	// If a CommonJS loader is present use CommonJS.
	// Otherwise assign the `cookie` object to the global scope.

	if (typeof define === 'function' && define.amd) {
		define(function () {
			return {cookie: cookie};
		});
	} else if (typeof exports !== 'undefined') {
		exports.cookie = cookie;
	} else window.cookie = cookie;

// If used e.g. with Browserify and CommonJS, document is not declared.
}(typeof document === 'undefined' ? null : document);
