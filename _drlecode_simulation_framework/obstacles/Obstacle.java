package obstacles;

import java.util.ArrayList;
import java.util.Arrays;

import agents.Position;
import agents.Property;
import agents.Property_category;
import entities.Entity;

public class Obstacle extends Entity
{
	/*
	 pos1 -------- pos2
	 |				  |	
	 |				  |
	 |				  |
	 |				  |
	 pos4 -------- pos3	
	  
	 */
	public Position pos1;
	
	//public Property_category(int ID, double init_value,boolean p, boolean g, ArrayList<Double> set_add)
	public Property type = new Property_category(4,1,true, false, new ArrayList<Double>(Arrays.asList(2.0))); 
	
	public Boolean intersect_in_corner = false;
	//obstacle
	public Obstacle(Position p, double type)
	{
		//2.x is obstacle type
		super(2.0);
		this.pos1 = p;
		this.type.value = type;
	}
	
	
	public Obstacle (Obstacle o)
	{
		super(2.0);
		this.pos1 = o.pos1;
		this.type.value = o.type.value;
	}
}
