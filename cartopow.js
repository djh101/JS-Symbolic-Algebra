function carToPow(expression){
	if(!expression) return expression;
	var table = {'sqrt':true,'exp':true,'log':true,'pow':true,'abs':true,'sin':true,'cos':true,'tan':true,'sec':true,'csc':true,'cot':true,'asin':true,'acos':true,'atan':true,'asec':true,'acsc':true,'acot':true,'sinh':true,'cosh':true,'tanh':true,'sech':true,'csch':true,'coth':true,'asinh':true,'acosh':true,'atanh':true,'asech':true,'acsch':true,'acoth':true};
	var fstore = new Array('pi'); //STORES FUNCTIONS
	
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
			
			var p1 = '('+subCarToPow(p2.slice(0,offset))+')';
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
	
	function subCarToPow(e0){
		e0 = e0.replace('pi','$0;');
		e0 = e0.replace(/([a-z]{2,5})\((.*)/g,functions);
		
		//array of positions: start of base, position of ^, end of power
		var pos = new Array(null,null,null);
		//array of parts: base and power
		var parts = new Array();
		var matches;
		for(var i=0;i<e0.length;++i){
			
			if(e0[i] === '^' && !pos[1]){
				pos[1] = i;
				
				//scan for base
				if(e0[i-1] === ')'){ //base is parenthetical
					depth = 0;
					for(var j=i-1;j>=0;--j){
						if(e0[j] === ')') depth++;
						if(e0[j] === '(') depth--;
						if(depth == 0){
							pos[0] = j;
							parts[0] = e0.substr(j, i-j);
							break;
						}
					}
				} else { //base is numerical
					if(matches = e0.match(/(\d*\.{0,1}\d+|[A-Za-z]|\$\d+;)\^/)){
						pos[0] = i - matches[0].length + 1;
						parts[0] = matches[0].substr(0,matches[0].length-1);
					} else return false;
				}
				
				//scan for power
				if(e0[i+1] === '('){ //power is parenthetical
					depth = 0;
					for(var j=i+1; j < e0.length; j++){
						if(e0[j] === '(') depth++;
						if(e0[j] === ')') depth--;
						if(depth == 0){
							pos[2] = j;
							parts[1] = e0.substr(i+1,j-i);
							break;
						}
					}
				} else { //power is numerical
					if(matches = e0.match(/\^(-?(\d*\.{0,1}\d+|[A-Za-z]|\$\d+;))/)){
						pos[2] = i + matches[0].length-1;
						parts[1] = matches[0].substr(1,matches[0].length-1);
					} else return false;
				}
				
				if(parts[0] == null || parts[1] == null) return false;
				e0 = e0.substr(0,pos[0])+'(pow('+parts[0]+','+parts[1]+'))'+e0.substr(pos[2]+1,e0.length-pos[2]);
				return subCarToPow(e0);
			}
		}
		return e0;
	}
	expression = subCarToPow(expression);
	while(expression.match(/\$(\d+);/)) expression = expression.replace(/\$(\d+);/g,unfunction);
	expression = expression.replace(/-/,'-1*');
	return expression;
}