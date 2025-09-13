package Goal;

import java.util.ArrayList;
import java.util.Arrays;

import agents.Position;
import agents.Property;
import agents.Property_category;
import entities.Entity;

public class Goal_point extends Goal 
{
	public Position position;
	public int heading = 0;
	public double speed = 0;
	//The radius of the goal point (how big it is)
	public int radius = 5;
	//The radius of effected area of the goal point
	public double effect_radius = 20;
	
	
	public Goal_point(Position pos_add, double type_v)
	{
		super(type_v);
		this.position = pos_add;
		this.position.glo = true;
	}
	
	public Goal_point(Goal_point gp)
	{
		super(gp.type.value);
		this.position = gp.position;
		this.heading = gp.heading;
		this.speed = gp.speed;
		this.position.glo = true;
	}
}
