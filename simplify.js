
function simplify(f0){
	//e.g. (x+2)x^(1+2)+sin(2(x+1))*x^3
	if(!f0) return f0;
	var table = {'sqrt':true,'exp':true,'log':true,'pow':true,'abs':true,'sin':true,'cos':true,'tan':true,'sec':true,'csc':true,'cot':true,'asin':true,'acos':true,'atan':true,'asec':true,'acsc':true,'acot':true,'sinh':true,'cosh':true,'tanh':true,'sech':true,'csch':true,'coth':true,'asinh':true,'acosh':true,'atanh':true,'asech':true,'acsch':true,'acoth':true};
	var fstore = new Array('pi'); //STORES FUNCTIONS
	
	function subseries(match, p1, p2, offset, string){ //EXPAND SERIES
		return '('+series(p1,p2)+')';
	}
	function minus(match,p1,offset,string){ //REPLACE x-y with x+-y
		if(p1.match(/[A-Za-z0-9\)]/)) return p1+'+-';
		else return p1+'-';
	}
	function division(match,p1,offset,string){ //REPLACE x/y WITH x*y^(-1)
		var depth = 0;
		if(p1[0] != '('){
			for(var i=0;i<p1.length;++i){ //SEARCH FOR FIRST OPERATOR
				if(p1[i] == ')' && depth > 0) --depth;
				else if(p1[i] == '(') ++depth;
				if(depth == 0 && p1[i].match(/[\+\*\^\)]/g)){
					p1 = '*('+p1.slice(0,i)+')^(-1)'+p1.slice(i,p1.length);
					return p1;
				}
			}
		} else {
			for(var i=1;i<p1.length;++i){ //SEARCH FOR CLOSING )
				if(p1[i] == ')') --depth;
				else if(p1[i] == '(') ++depth;
				if(depth == -1){
					p1 = '*('+p1.slice(0,i)+')^(-1)'+p1.slice(i,p1.length);
					return p1;
				}
			}
		}
		return '*('+p1+')^(-1)';
	}
	function functions(match,p0,p2,offset,string){ //STORE FUNCTION, SIMPLIFY CONTENTS, AND REPLACE WITH $n;
		if(p0 == 'ln') p0 = 'log';
		if(table[p0]){
			var depth = 0;
			var offset = 0;
			for(var i=0;i<p2.length;++i){ //DIG FOR CLOSING )
				if(p2[i] == ')') --depth;
				else if(p2[i] == '(') ++depth;
				if(depth == -1){
					offset = i;
					break;
				}
			}
			
			var p1 = '('+subsimplify(p2.slice(0,offset))+')';
			if(offset >= p2.length-1) p2 = '';
			else {
				if(p2[offset+1].match(/[\+\*]/)) p2 = p2[offset+1]+p2.slice(offset+2,p2.length).replace(/([a-z]{2,5})\((.*)/g,functions);
				else p2 = p2.slice(offset+1,p2.length).replace(/([a-z]{2,5})\((.*)/g,functions);
			}
			if(p0 == 'sqrt') return p1.replace(/([a-z]{2,5})\((.*)/g,functions)+'^.5'+p2; //RETURN sqrt => ^.5
			else if(p0 == 'exp') return 'e^'+p1.replace(/([a-z]{2,5})\((.*)/g,functions)+p2; //RETURN exp => e^
			
			for(var i=0;i<fstore.length;++i){ //SEARCH fstore FOR EXISTING FUNCTION
				if(fstore[i] == p0+p1) return '$'+i+';'+p2;
			}
			fstore.push(p0+p1);
			return '$'+(fstore.length-1)+';'+p2;
		}
		return p0+'('+p2+')';
	}
	function unfunction(match,p1,offset,string){ //REPLACE FUNCTION IDENTIFIERS WITH STORED FUNCTION
		return fstore[p1];
	}
	function multiplication(match,p1,p2,offset,string){
		return p1+'*'+p2;
	}
	
	function subsimplify(f){ //MAIN SIMPLIFICATION FUNCTION
		var addends = new Array();
		addends[0] = new Array();
		addends[0]['#'] = '1';
		f = f.replace(/s\('([^']+)',(\d+)\)/g,subseries);
		f = f.replace('-(','-1*(');
		f = f.replace('pi','$0;');
		f = f.replace(/(.)-/g,minus);
		f = f.replace(/\/(.*)/g,division);
		f = f.replace(/([a-z]{2,5})\((.*)/g,functions);
		f = f.replace(/(\$\d;|[\da-z\)])(\$\d;|[a-z\(])/g,multiplication);
		f = f.replace(/(\$\d;|[a-z\)])(\$\d;|[\da-z\(])/g,multiplication);
		var depth = 0;
		var exp = false, base = '', exponent = '';
		/* POPULATE STORAGE ARRAY */
		for(var i=0;i<f.length;++i){
			if(f[i] == '('){
				++depth;
				if(depth == 1) continue;
			} else if(f[i] == ')'){
				--depth;
				if(depth == 0) continue;
			}
			var pos0 = addends.length-1;
			if(depth > 0){
				if(exp) exponent += f[i]; //ADD TO EXPONENT
				else base += f[i]; //ADD TO BASE
			} else if(depth == 0){
				if(f[i] == '^'){
					if(exp){
						base = '('+base+')^'+exponent;
						exponent = '';
					} else exp = true;
				} else if(f[i] == '+' || f[i] == '*'){
					if(exponent === '') exponent = '1';
					else if(exponent === '0'){ base = '1'; exponent = '1'; }
					if(base.match(/^-?\d*\.?\d+$/) && exponent.match(/^-?\d*\.?\d+$/)) addends[pos0]['#'] *= exponent == '1' ? parseFloat(base) : Math.pow(parseFloat(base),parseFloat(exponent)); // !!! USE SYMBOLIC/MULTIPRICISION ARITHMETIC !!!
					else addends[pos0][base] = addends[pos0][base] ? addends[pos0][base]+'+'+exponent : exponent;
					exp = false; base = ''; exponent = '';
					if(f[i] == '+'){
						addends.push(new Array());
						addends[addends.length-1]['#'] = '1';
					}
				} else {
					if(exp) exponent += f[i];
					else base += f[i];
				}
			}
		}
		if(base == '') addends.splice(addends.length-1,1);
		else { //ADD LAST ENTRY TO ARRAY
			if(exponent === '') exponent = '1';
			else if(exponent === '0'){ base = '1'; exponent = '1'; }
			if(base.match(/^-?\d*\.?\d+$/) && exponent.match(/^-?\d*\.?\d+$/)) addends[addends.length-1]['#'] *= exponent == '1' ? parseFloat(base) : Math.pow(parseFloat(base),parseFloat(exponent)); // !!! USE SYMBOLIC/MULTIPRICISION ARITHMETIC !!!
			else addends[addends.length-1][base] = addends[addends.length-1][base] ? addends[addends.length-1][base]+'+'+exponent : exponent;
		}
		
		depth = 0;
		exp = false; base = ''; exponent = '';
		/* DISTRIBUTE SUMS/PRODUCTS */
		for(var i=0;i<addends.length;++i){
			for(var j in addends[i]){
				if(j == '#') continue;
				if(j.match(/[\+\*\(]/) && addends[i][j] == '1'){
					addends.push(new Array()); //MOVE CELL TO END OF ADDENDS, OMITTING j
					for(var v in addends[i]) if(v != j) addends[addends.length-1][v] = addends[i][v];
					for(var k=0;k<j.length;++k){ //POPULATE STORAGE ARRAY (AGAIN)
						if(j[k] == '('){
							++depth;
							if(depth == 1) continue;
						} else if(j[k] == ')'){
							--depth;
							if(depth == 0) continue;
						}
						var pos0 = addends.length-1;
						if(depth > 0){
							if(exp) exponent += j[k]; //ADD TO EXPONENT
							else base += j[k]; //ADD TO BASE
						} else if(depth == 0){
							if(j[k] == '^'){
								if(exp){
									base = '('+base+')^'+exponent;
									exponent = '';
								} else exp = true;
							} else if(j[k] == '+'){
								if(exponent === '') exponent = '1';
								else if(exponent === '0'){ base = '1'; exponent = '1'; }
								addends.push(new Array()); //DUPLICATE THE ADDEND CONTAINING j, OMITTING j
								for(var v in addends[i]) if(v != j) addends[addends.length-1][v] = addends[i][v];
								if(base.match(/^-?\d*\.?\d+$/) && exponent.match(/^-?\d*\.?\d+$/)) addends[pos0]['#'] *= exponent == '1' ? parseFloat(base) : Math.pow(parseFloat(base),parseFloat(exponent)); // !!! USE SYMBOLIC/MULTIPRICISION ARITHMETIC !!!
								else addends[pos0][base] = addends[pos0][base] ? addends[pos0][base]+'+'+exponent : exponent;
								exp = false; base = ''; exponent = '';
								
							} else if(j[k] == '*'){
								if(exponent === '') exponent = '1';
								else if(exponent === '0'){ base = '1'; exponent = '1'; }
								if(base.match(/^-?\d*\.?\d+$/) && exponent.match(/^-?\d*\.?\d+$/)) addends[pos0]['#'] *= exponent == '1' ? parseFloat(base) : Math.pow(parseFloat(base),parseFloat(exponent)); // !!! USE SYMBOLIC/MULTIPRICISION ARITHMETIC !!!
								else addends[pos0][base] = addends[pos0][base] ? addends[pos0][base]+'+'+exponent : exponent;
								exp = false; base = ''; exponent = '';
							} else {
								if(exp) exponent += j[k]; //ADD TO EXPONENT
								else base += j[k]; //ADD TO BASE
							}
						}
					}
					if(base === '') addends.splice(addends.length-1,1);
					else {
						if(exponent === '') exponent = '1';
						else if(exponent === '0'){ base = '1'; exponent = '1'; }
						if(base.match(/^-?\d*\.?\d+$/) && exponent.match(/^-?\d*\.?\d+$/)) addends[addends.length-1]['#'] *= exponent == '1' ? parseFloat(base) : Math.pow(parseFloat(base),parseFloat(exponent)); // !!! USE SYMBOLIC/MULTIPRICISION ARITHMETIC !!!
						else addends[addends.length-1][base] = addends[addends.length-1][base] ? addends[addends.length-1][base]+'+'+exponent : exponent;
					}
					exp = false; base = ''; exponent = '';
					addends.splice(i,1);
					i = -1;
					break;
				}
			}
		}
		/* SIMPLIFY NUMBERS */
		function length(obj){
			if(!obj) return false;
			var size = 0, key;
			for(var key in obj) {
				if(obj.hasOwnProperty(key)) size++;
			}
			return size;
		}
		for(var i=0;i<addends.length;++i){
			for(var j in addends[i]){
				if(j == '#'){ //SKIP NUMERIC CELL
					if(addends[i][j] == '0'){ //MULTIPLYING BY 0
						addends.splice(i,1);
						--i;
						break;
					} else continue;
				}
				if(!addends[i][j].match(/^-?\d*\.?\d+$/)) addends[i][j] = subsimplify(addends[i][j]); //SIMPLIFY EXPONENT
				if(addends[i][j] === '0') delete addends[i][j]; //SET = 1 FOR 0 EXPONENT
			}
		}
		/*var g = '';
		for(var i=0;i<addends.length;++i){
			for(var j in addends[i]){
				g += '['+i+']['+j+']='+addends[i][j]+'<br />';
			}
		}
		document.write(g);
		return false;*/
		for(var i=0;i<addends.length-1;++i){ //COMBINE ADDENDS
			outer:
			for(var i2=i+1;i2<addends.length;++i2){ //SCAN ADDENDS
				if(i != '#' && i2 != '#'){
					for(var j in addends[i]) if(j != '#' && addends[i][j] !== addends[i2][j]) continue outer;
					for(var j in addends[i2]) if(j != '#' && addends[i][j] !== addends[i2][j]) continue outer;
				}
				addends[i2]['#'] = parseFloat(addends[i2]['#']) + parseFloat(addends[i]['#']); // !!! USE SYMBOLIC/MULTIPRICISION ARITHMETIC !!!
				addends.splice(i,1);
				--i
				break;
			}
			
		}
		
		f = '';
		for(var i in addends){ //GENERATE f FROM STORAGE ARRAY
			if(addends[i]['#'] != 1 || length(addends[i]) == 1){
				f += addends[i]['#']+'*';
			}
			for(var j in addends[i]){
				if(j == '#') continue;
				var foo = j, bar = addends[i][j];
				if(addends[i][j] != 1 && j.match(/[\+\*]/)) foo = '('+j+')';
				if(addends[i][j].match(/[\+\*]/)) bar = '('+addends[i][j]+')';
				f += addends[i][j] == 1 ? foo+'*' : foo+'^'+(bar.match(/\^/)  ? '('+bar+')' : bar)+'*';
			}
			f = f.substr(0,f.length-1)+'+';
		}
		f = f.substr(0,f.length-1);
		
		return f;
	}
	f0 = subsimplify(f0);
	while(f0.match(/\$(\d+);/)) f0 = f0.replace(/\$(\d+);/g,unfunction);
	return f0 ? f0 : '0';
}
