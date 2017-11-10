const fs = require('fs');
const YAML = require('yamljs');
const babylon = require('babylon');
const traverse = require('babel-traverse').default;
const t = require('babel-types');
const generator = require('babel-generator').default;
const R = require('ramda');

const zwangger = function (inputPath, outputPath){
  
  const input = YAML.load(inputPath);
  
  const code = `let a = ${JSON.stringify(input)}`;
  
  const ast = babylon.parse(code);
  
  traverse(ast, {
    Property(path) {
      
      if(path.node.key.value === 'x-required-all-except'){
  
        let propertiesNode = path.container.find(function(node){
          return node.key.value === 'properties';
        });
  
        if (!propertiesNode){
          return;
        }
  
        let exceptValues = path.node.value.elements.map(function(node){
          return node.value;
        });
  
        // let's assume for now there is no require node 
        // let requiredNode = path.container.find(function(node){
        //   return node.key.value === 'required';
        // });
  
        let propertiesValues = propertiesNode.value.properties.map(function(node){
          return node.key.value;
        });
  
        let propertiesLiterals = R.difference(propertiesValues, exceptValues).map(function(val){
          return t.stringLiteral(val);
        });
        
        let requiredNode = t.objectProperty(t.stringLiteral('required'), t.arrayExpression(propertiesLiterals));
  
        path.insertAfter(requiredNode);
        
        path.remove();
      }
    }
  });
  
  // removing the beginning `let a = ` and ending `;`
  const jsonString = generator(ast).code.slice(8).slice(0,-1);
  
  const output = YAML.stringify(JSON.parse(jsonString), 64, 2);
  
  fs.writeFileSync(outputPath, output);

};

module.exports = zwangger;