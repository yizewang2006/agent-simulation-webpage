var agent;

function startSimulation() 
{
  agent = new AgentComponent(100, 100,5);
  world.start();
}

var world = 
{
  canvas : document.createElement("canvas"),

  start : function() 
  {
  	
  	GlobalVariable = new GlobalVariable();
    
    this.canvas.width = GlobalVariable.WorldSize;
    this.canvas.height = GlobalVariable.WorldSize;

    this.context = this.canvas.getContext("2d");

    document.body.insertBefore(this.canvas, document.body.childNodes[0]);

    this.interval = setInterval(updateWorld, 50);

    //Create random agent
    agent1 = new Agent();
  },

  clear : function() 
  {

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

function AgentComponent(x, y, radius) 
{
	//Agent shape
	this.radius = radius;
    this.x = x;
    this.y = y;    
    //ctx = world.context;
    //ctx.arc(this.x, this.y, this.radius,0,2*Math.PI);

    this.update = function()
    {
    	ctx = world.context;
    	ctx.beginPath();
    	ctx.arc(this.x, this.y, this.radius,0,2*Math.PI);
    	ctx.stroke();

    	 //Agent heading direction
	    
	    heading_pointer = world.context;
	    heading_pointer.beginPath();
	    heading_pointer.moveTo(this.x,this.y);
	    heading_pointer.lineTo(this.x+7,this.y+7);
	    heading_pointer.stroke();
		
  	}
}

function updateWorld() 
{
  world.clear();
  agent.x += 3;
  agent.y += 3;
  agent.update();
}