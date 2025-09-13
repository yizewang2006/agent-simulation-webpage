package obstacles;

import agents.Position;
import entities.Entity;

public class Obstacle_circle extends Obstacle
{
	/*
	 pos1 -------- pos2
	 |				  |	
	 |				  |
	 |				  |
	 |				  |
	 pos4 -------- pos3	
	  
	 */
	public Position pos;
	public int radius;
	public String shape_type;
	public double speed;
	public int heading;
	public int change_direction_duration;
	//This value is sorely use for adaptive FOV
	//Where agent only sense a part of the obstalce
	//That part is not within FOV of agent
	public boolean always_sense = false;
	
	//Circle obstacle
	public Obstacle_circle(Position p, int r, double type)
	{	
		super(p,2.1);
		this.shape_type = "circle";
		this.pos = p;
		this.radius = r;
		this.type.value = type;
		
	}
	
	//Deep copy circle obstacle
	public Obstacle_circle(Obstacle_circle o)
	{	
		super(o.pos,2.1);
		this.shape_type = "circle";
		this.pos = o.pos;
		this.radius = o.radius;
		this.heading = o.heading;
		this.speed = o.speed;
		this.type.value = o.type.value;
		this.change_direction_duration = o.change_direction_duration;
	}

}
