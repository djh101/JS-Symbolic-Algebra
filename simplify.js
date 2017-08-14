/**
 * Simplify a function.
 *
 * @param {string} f0 - Function to be simplified (e.g. (x+2)x^(1+2)+sin(2(x+1))*x^3)
 * @returns {string}
 */
function simplify(f0){
	/**
	 * @type {string[]} - Array of mathematical functions
	 * @const
	 */
	const funcs = [
		'sqrt',
		'exp',
		'log',
		'pow',
		'abs',
		'sin',
		'cos',
		'tan',
		'sec',
		'csc',
		'cot',
		'asin',
		'acos',
		'atan',
		'asec',
		'acsc',
		'acot',
		'sinh',
		'cosh',
		'tanh',
		'sech',
		'csch',
		'coth',
		'asinh',
		'acosh',
		'atanh',
		'asech',
		'acsch',
		'acoth'
	];
	
	/**
	 * @type {string[]} - Temporary function storage
	 */
	var fstore = ['pi']; //STORES FUNCTIONS
	
	/**
	 * Expand series in subseries.
	 */
	function subseries(match, p1, p2, offset, string){
		//
	}
	
	/**
	 * Replace x-y with x+-y.
	 */
	function minus(match, p1, offset, string){
		if(p1.match(/[a-z0-9]/gi)){
			return p1+'+-1*';
		} else {
			return p1+'-';
		}
	}
	
	/**
	 * Replace x/y with x*y^(-1).
	 */
	function division(match, p1, offset, string){
		var depth = 0;
		if(p1[0] !== '('){
			// Search for first operator
			for(var i=0; i<p1.length; ++i){
				if(p1[i] === ')' && depth > 0){
					--depth;
				} else if(p1[i] === '('){
					++depth;
				}
				if(depth === 0 && p1[i].match(/[\+\*\^\)]/g)){
					p1 = '*('+p1.slice(0, i)+')^(-1)'+p1.slice(i, p1.length);
					return p1;
				}
			}
		} else {
			// Search for closing )
			for(var i=1; i<p1.length; ++i){
				if(p1[i] === ')'){
					--depth;
				} else if(p1[i] === '('){
					++depth;
				}
				if(depth === -1){
					p1 = '*('+p1.slice(0, i)+')^(-1)'+p1.slice(i, p1.length);
					return p1;
				}
			}
		}
		return '*('+p1+')^(-1)';
	}
	
	/**
	 * Store mathematical functions, simplify contents, and replace with $n.
	 */
	function functions(match, p0, p2, offset, string){
		if(p0 === 'ln'){
			p0 = 'log';
		}
		if(funcs.indexOf(p0) !== -1){
			var depth = 0;
			var offset = 0;
			// Dig for closing )
			for(var i=0; i<p2.length; ++i){
				if(p2[i] === ')'){
					--depth;
				} else if(p2[i] === '('){
					++depth;
				}
				if(depth === -1){
					offset = i;
					break;
				}
			}
			
			var p1 = '('+subsimplify(p2.slice(0, offset))+')';
			if(offset >= p2.length-1){
				p2 = '';
			} else {
				if(p2[offset+1].match(/[\+\*]/)){
					p2 = p2[offset+1]+p2.slice(offset+2, p2.length).replace(/([a-z]{2,5})\((.*)/g, functions);
				} else {
					p2 = p2.slice(offset+1, p2.length).replace(/([a-z]{2,5})\((.*)/g, functions);
				}
			}
			// Replace sqrt with ^.5
			if(p0 === 'sqrt'){
				return p1.replace(/([a-z]{2,5})\((.*)/g, functions)+'^.5'+p2;
			// Replace exp with e^
			} else if(p0 === 'exp'){
				return 'e^'+p1.replace(/([a-z]{2,5})\((.*)/g, functions)+p2;
			}
			
			// Search fstor for existing function
			for(var i=0; i<fstore.length; ++i){
				if(fstore[i] === p0+p1){
					return '$'+i+';'+p2;
				}
			}
			fstore.push(p0+p1);
			return '$'+(fstore.length-1)+';'+p2;
		}
		return p0+'('+p2+')';
	}
	
	/**
	 * Replace function identifiers with stored function.
	 */
	function unfunction(match, p1, offset, string){
		return fstore[p1];
	}
	
	/**
	 * Insert * into multiplication operations.
	 */
	function multiplication(match, p1, p2, offset, string){
		return p1+'*'+p2;
	}
	
	/**
	 * Main simplification function.
	 *
	 * @param {string} f - Function to be simplified
	 * @returns {string}
	 */
	function subsimplify(f){
		var addends = [];
		addends[0] = [];
		addends[0]['#'] = 1;
		// FIXME ???
		f = f.replace(/s\('([^']+)',(\d+)\)/g, subseries);
		f = f.replace('-(', '-1*(');
		// Replace pi with placeholder
		f = f.replace('pi', '$0;');
		// Replace minus signs
		f = f.replace(/--/g, '+');
		f = f.replace(/(.)-/g, minus);
		// Replace division signs
		f = f.replace(/\/(.*)/g, division);
		// Replace functions with placeholders
		f = f.replace(/([a-z]{2,5})\((.*)/g, functions);
		// FIXME ???
		f = f.replace(/(\$\d;|[\da-z\)])(\$\d;|[a-z\(])/g, multiplication);
		// FIXME ???
		f = f.replace(/(\$\d;|[a-z\)])(\$\d;|[\da-z\(])/g, multiplication);
		
		var depth = 0;
	
		/**
		 * @type {boolean} - Whether to add to exponent (true) or base (false)
		 */
		var exp = false;
	
		/**
		 * @type {string} - Base storage string
		 */
		var base = '';
	
		/**
		 * @type {string} - Exponent storage string
		 */
		var exponent = '';
	
		/**
		 * @type {string} - Contents of parenthesis
		 */
		var subf = '';
		
		// Populate storage array
		for(var i=0; i<f.length; ++i){
			if(f[i] === '('){
				++depth;
				if(depth === 1){
					continue;
				}
			} else if(f[i] === ')'){
				--depth;
				if(depth === 0){
					continue;
				}
			}
			
			var pos0 = addends.length-1;
			
			if(depth > 0){
				// Add to exponent
				if(exp){
					exponent += f[i];
				// Add to base
				} else {
					base += f[i];
				}
			} else if(depth === 0){
				if(f[i] === '^'){
					if(exp){
						base = '('+base+')^'+exponent;
						exponent = '';
					} else {
						exp = true;
					}
				} else if(f[i] === '+' || f[i] === '*'){
					if(exponent === ''){
						exponent = '1';
					} else if(exponent === '0'){
						base = '1';
						exponent = '1';
					}
					// Perform arithmetic if exponent is numeric
					if(base.match(/^-?\d*\.?\d+$/) && exponent.match(/^-?\d*\.?\d+$/)){
						addends[pos0]['#'] *= exponent === '1' ? parseFloat(base) : parseFloat(base)**parseFloat(exponent); // XXX USE SYMBOLIC/MULTIPRICISION ARITHMETIC
					} else {
						if(base[0] === '-'){
							
						}
						addends[pos0][base] = addends[pos0][base] ? addends[pos0][base]+'+'+exponent : exponent;
					}
					
					exp = false;
					base = '';
					exponent = '';
					
					if(f[i] === '+'){
						addends.push([]);
						addends[pos0+1]['#'] = 1;
					}
				} else {
					if(exp){
						exponent += f[i];
					} else {
						base += f[i];
					}
				}
			}
		}
		
		if(base === ''){
			addends.splice(addends.length-1, 1);
		// Add last entry to array
		} else {
			if(exponent === ''){
				exponent = '1';
			} else if(exponent === '0'){
				base = '1';
				exponent = '1';
			}
			// Perform arithmetic if exponent is numeric
			if(base.match(/^-?\d*\.?\d+$/) && exponent.match(/^-?\d*\.?\d+$/)){
				addends[addends.length-1]['#'] *= exponent === '1' ? parseFloat(base) : parseFloat(base)**parseFloat(exponent); // XXX USE SYMBOLIC/MULTIPRICISION ARITHMETIC
			} else {
				addends[addends.length-1][base] = addends[addends.length-1][base] ? addends[addends.length-1][base]+'+'+exponent : exponent;
			}
		}
		
		depth = 0;
		exp = false;
		base = '';
		exponent = '';
		
		// Distribute sums/products
		for(var i=0; i<addends.length; ++i){
			for(var j in addends[i]){
				if(j === '#'){
					continue;
				}
				if(j.match(/[\+\*\(]/) && addends[i][j] === '1'){
					// Move cell to end of addnes, omitting j
					addends.push([]);
					for(var v in addends[i]){
						if(v !== j){
							addends[addends.length-1][v] = addends[i][v];
						}
					}
					// Populate storage array (again)
					for(var k=0; k<j.length; ++k){
						if(j[k] === '('){
							++depth;
							if(depth === 1){
								continue;
							}
						} else if(j[k] === ')'){
							--depth;
							if(depth === 0){
								continue;
							}
						}
						
						var pos0 = addends.length-1;
						
						if(depth > 0){
							// Add to exponent
							if(exp){
								exponent += j[k];
							// Add to base
							} else {
								base += j[k];
							}
						} else if(depth === 0){
							if(j[k] === '^'){
								if(exp){
									base = '('+base+')^'+exponent;
									exponent = '';
								} else {
									exp = true;
								}
							} else if(j[k] === '+'){
								if(exponent === ''){
									exponent = '1';
								} else if(exponent === '0'){
									base = '1';
									exponent = '1';
								}
								// Duplicate the addend containing j, omitting j
								addends.push([]);
								for(var v in addends[i]){
									if(v !== j){
										addends[pos0][v] = addends[i][v];
									}
								}
								// Perform arithmetic if exponent is numeric
								if(base.match(/^-?\d*\.?\d+$/) && exponent.match(/^-?\d*\.?\d+$/)){
									addends[pos0]['#'] *= exponent === '1' ? parseFloat(base) : parseFloat(base)**parseFloat(exponent); // XXX USE SYMBOLIC/MULTIPRICISION ARITHMETIC
								} else {
									addends[pos0][base] = addends[pos0][base] ? addends[pos0][base]+'+'+exponent : exponent;
								}
								
								exp = false;
								base = '';
								exponent = '';
								
							} else if(j[k] === '*'){
								if(exponent === ''){
									exponent = '1';
								} else if(exponent === '0'){
									base = '1';
									exponent = '1';
								}
								// Perform arithmetic if exponent is numeric
								if(base.match(/^-?\d*\.?\d+$/) && exponent.match(/^-?\d*\.?\d+$/)){
									addends[pos0]['#'] *= exponent === '1' ? parseFloat(base) : parseFloat(base)**parseFloat(exponent); // XXX USE SYMBOLIC/MULTIPRICISION ARITHMETIC
								} else {
									addends[pos0][base] = addends[pos0][base] ? addends[pos0][base]+'+'+exponent : exponent;
								}
								
								exp = false;
								base = '';
								exponent = '';
								
							} else {
								// Add to exponent
								if(exp){
									exponent += j[k];
								// Add to base
								} else {
									base += j[k];
								}
							}
						}
					}
					if(base === ''){
						addends.splice(addends.length-1, 1);
					} else {
						var pos0 = addends.length-1;
						
						if(exponent === ''){
							exponent = '1';
						} else if(exponent === '0'){
							base = '1';
							exponent = '1';
						}
						// Perform arithmetic if exponent is numeric
						if(base.match(/^-?\d*\.?\d+$/) && exponent.match(/^-?\d*\.?\d+$/)){
							addends[pos0]['#'] *= exponent === '1' ? parseFloat(base) : parseFloat(base)**parseFloat(exponent); // XXX USE SYMBOLIC/MULTIPRICISION ARITHMETIC
						} else {
							addends[pos0][base] = addends[pos0][base] ? addends[pos0][base]+'+'+exponent : exponent;
						}
					}
					
					exp = false;
					base = '';
					exponent = '';
					
					addends.splice(i, 1);
					i = -1;
					break;
				}
			}
		}
	
		/**
		 * Return the length of an object
		 *
		 * @param {object} obj
		 * @returns {integer|boolean}
		 */
		function length(obj){
			if(!obj){
				return false;
			}
			var size = 0, key;
			for(var key in obj) {
				if(obj.hasOwnProperty(key)){
					++size;
				}
			}
			return size;
		}
		
		// Simplify numbers
		for(var i=0; i<addends.length; ++i){
			for(var j in addends[i]){
				// Skip numeric cell
				if(j === '#'){
					// Multiplying by 0
					if(addends[i][j] === 0){
						addends.splice(i, 1);
						--i;
						break;
					} else {
						continue;
					}
				} else {
					// Simplify exponent
					if(!addends[i][j].match(/^-?\d*\.?\d+$/)){
						addends[i][j] = subsimplify(addends[i][j]);
					}
					// Set = 1 for 0 exponent
					if(addends[i][j] === '0'){
						delete addends[i][j];
					}
				}
			}
		}
		// Combine addends
		console.log(addends);
		console.log(addends.length);
		for(var i=0; i<addends.length-1; ++i){
			outer:
			// Scan addends
			for(var i2=i+1; i2<addends.length; ++i2){
				// Iterate over factors of addend i
				for(var j in addends[i]){
					// Continue if factors are not equal
					if(j !== '#' && addends[i][j] !== addends[i2][j]){
						continue outer;
					}
				}
				// Iterate over factors of addend i2
				for(var j in addends[i2]){
					// Continue if factors are not equal
					if(j !== '#' && addends[i][j] !== addends[i2][j]){
						continue outer;
					}
				}
				addends[i2]['#'] = addends[i2]['#'] + addends[i]['#']; // XXX USE SYMBOLIC/MULTIPRICISION ARITHMETIC
				addends.splice(i, 1);
				--i
				break;
			}
			
		}
		
		f = '';
		
		// Generate f from storage array
		for(var i in addends){
			if(addends[i]['#'] === 0){
				continue;
			}
			if(addends[i]['#'] !== 1 || length(addends[i]) === 1){
				f += addends[i]['#'];
			}
			for(var j in addends[i]){
				if(j === '#'){
					continue;
				}
				
				var foo = j;
				var bar = addends[i][j];
				
				if(addends[i][j] !== '1' && j.match(/[\+\*]/)){
					foo = '('+j+')';
				}
				if(addends[i][j].match(/[\+\*]/)){
					bar = '('+addends[i][j]+')';
				}
				// FIXME Check and remove.
				// f += addends[i][j] === '1' ? foo+'*' : foo+'^'+(bar.match(/\^/)  ? '('+bar+')' : bar)+'*';
				f += addends[i][j] === '1' ? foo : foo+'^'+(bar.match(/\^/)  ? '('+bar+')' : bar);
			}
			// FIXME Check and remove.
			// f = f.substr(0, f.length-1)+'+';
			f += '+';
		}
		f = f.substr(0, f.length-1);
		
		return f;
	}
	
	f0 = subsimplify(f0);
	while(f0.match(/\$(\d+);/)){
		f0 = f0.replace(/\$(\d+);/g, unfunction);
	}
	return f0 ? f0 : '0';
}
