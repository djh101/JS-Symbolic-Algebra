function derive(f0,x0){
	f0 = simplify(f0);
	f0 = f0.replace('-'+x0,'-1*'+x0);
	var table = {'abs'   : '(u)*((u)^2)^-.5',
				 'log'   : '(u)^-1',
				 'sin'   : 'cos(u)',
				 'cos'   : '-sin(u)',
				 'tan'   : 'sec(u)^2',
				 'csc'   : '-csc(u)*cot(u)',
				 'sec'   : 'sec(u)*tan(u)',
				 'cot'   : '-csc(u)^2',
				 'asin'  : 'sqrt(1-(u)^2)',
				 'acos'  : '-sqrt(1-(u)^2)',
				 'atan'  : '(1+(u)^2)^(-1)',
				 'acsc'  : '-(abs(u)*sqrt((u)^2-1))^-1',
				 'asec'  : '(abs(u)*sqrt((u)^2-1))^-1',
				 'acot'  : '-(1+(u)^2)^-1',
				 'sinh'  : 'cosh(u)',
				 'cosh'  : 'sinh(u)',
				 'tanh'  : 'sech(u)^2',
				 'csch'  : '-csch(u)*coth(u)',
				 'sech'  : '-sech(u)*tanh(u)',
				 'coth'  : '-csch(u)^2',
				 'asinh' : '((u)^2+1)^(-.5)',
				 'acosh' : '((u)^2-1)^(-.5)',
				 'atanh' : '(1-(u)^2)^(-1)',
				 'acsch' : '-(abs(u)*sqrt(1+(u)^2))^-1',
				 'asech' : '-(abs(u)*sqrt(1-(u)^2))^-1',
				 'acoth' : '(1-(u)^2)^-1'
				 };
	var fstore = new Array(); //STORES FUNCTIONS
	
	function functions(match,p0,p2,offset,string){ //DERIVE FUNCTION AND REPLACE WITH $n;
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
			
			var p1 = table[p0].replace(/u/g,p2.slice(0,offset))+'*('+subderive(p2.slice(0,offset),x0)+')';
			if(offset >= p2.length-1) p2 = '';
			else {
				if(p2[offset+1].match(/[\+\*]/)) p2 = p2[offset+1]+p2.slice(offset+2,p2.length).replace(/([a-z]{2,5})\((.*)/g,functions);
				else p2 = p2.slice(offset+1,p2.length).replace(/([a-z]{2,5})\((.*)/g,functions);
			}
			
			for(var i=0;i<fstore.length;++i){ //SEARCH fstore FOR EXISTING FUNCTION
				if(fstore[i] == p1) return '$'+i+';'+p2;
			}
			fstore.push(p1);
			return '$'+(fstore.length-1)+';'+p2;
		}
		return p0+'('+p2+')';
	}
	function unfunction(match, p1, offset, string){ //REPLACE FUNCTION IDENTIFIERS WITH STORED FUNCTION
		return fstore[p1];
	}
	
	function subderive(f,x){ //MAIN SIMPLIFICATION FUNCTION
		var addends = new Array();
		addends[0] = new Array();
		addends[0]['#'] = '1';
		f = f.replace(/([a-z]{2,5})\((.*)/g,functions);
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
				if(f[i] == '^') exp = true;
				else if(f[i] == '+' || f[i] == '*'){
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
		/* TAKE DERIVATIVE */
		var daddends = new Array();
		daddends[0] = new Array();
		daddends[0]['#'] = '0';
		for(var i=0;i<addends.length;++i){
			for(var j in addends[i]){
				if(j.match(/\$(-?[0-9]+);/)){
					daddends.push(addends[i]);
					continue;
				} else if(j != x) continue;
				daddends.push(addends[i]);
				var k = daddends.length-1;
				daddends[k][addends[i][j]+''] = daddends[k][addends[i][j]+''] ? daddends[k][addends[i][j]+'']+1 : '1' // !!! USE SYMBOLIC/MULTIPRICISION ARITHMETIC !!!
				daddends[k][j] += '+-1';
			}
		}
		
		/* GENERATE f FROM STORAGE ARRAY */
		f = '';
		for(var i in daddends){
			f += daddends[i]['#']+'*';
			for(var j in daddends[i]){
				if(j == '#') continue;
				var foo = j, bar = daddends[i][j];
				if(daddends[i][j] != 1 && j.match(/[\+\*]/g)) foo = '('+j+')';
				if(daddends[i][j].match(/[\+\*]/g)) bar = '('+daddends[i][j]+')';
				f += daddends[i][j] == 1 ? foo+'*' : foo+'^'+bar+'*';
			}
			f = f.substr(0,f.length-1)+'+';
		}
		f = f.substr(0,f.length-1);
		return f;
	}
	f0 = subderive(f0,x0);
	while(f0.match(/\$([0-9]+);/)) f0 = f0.replace(/\$([0-9]+);/g,unfunction);
	return simplify(f0);
}
