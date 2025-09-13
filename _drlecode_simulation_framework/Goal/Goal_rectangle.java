package Goal;

import java.util.ArrayList;
import java.util.Arrays;

import agents.Position;
import agents.Property;
import agents.Property_category;
import agents.agentGenerator;
import core.Main;
import entities.Entity;
import zones.Zone;
import zones.Zone_rectangle;

public class Goal_rectangle extends Goal 
{
	public Position position;
	public Zone_rectangle zone_goal;
	public ArrayList<agentGenerator> a_generator = new ArrayList<agentGenerator>();
	
	//How many agent will be generated at a specific rate
	public int density = 1;
	public int rate = 10;
	
	public boolean remove_agent = false;
	
	public Goal_rectangle()
	{
		super(0);
	}
	
	//A goal rectangle without agent generator 
	public Goal_rectangle(Zone_rectangle zone_add, double type_v, boolean remove_a)
	{
		super(type_v);
		this.zone_goal = zone_add;
		
		this.zone_goal.pos1.glo = true;
		this.zone_goal.pos2.glo = true;
		this.zone_goal.pos3.glo = true;
		this.zone_goal.pos4.glo = true;
		
		this.remove_agent = remove_a;
	}
	
	//h is starting heading
	//s is starting speed
	//t is starting type

	//A goal rectangle with agent generator 
	//Density control how many agents are generated at a specific rate
	//Rate control how fast group of agents is generated
	public Goal_rectangle(Zone_rectangle zone_add,  double type_v, int density, int rate, int h, double s, double t)
	{
		super(type_v);
		this.zone_goal = zone_add;
		
		this.zone_goal.pos1.glo = true;
		this.zone_goal.pos2.glo = true;
		this.zone_goal.pos3.glo = true;
		this.zone_goal.pos4.glo = true;
		
		this.density = density;
		this.rate = rate;
		
		for (int i = 0; i < density; i++)
		{
			agentGenerator a_gen = new agentGenerator(new Position((this.zone_goal.pos1.x + this.zone_goal.pos2.x)/2, this.zone_goal.pos1.y), h,s,t,1);
			//a_gen.randomYPosition((int)this.zone_goal.pos1.y+5, Math.abs((int)this.zone_goal.pos4.y - 5));
			
			a_generator.add(a_gen);
		}
	}
	
	public void randomYPosition(ArrayList<agentGenerator> a_gen)
	{
		//Make sure no overlap between agents
		
		boolean overlap = true;
		
		do 
		{
			overlap = false;
			//Reset random position of agent generator
			for (agentGenerator a : a_gen)
			{
				a.randomYPosition((int)this.zone_goal.pos1.y+6, Math.abs((int)this.zone_goal.pos4.y - 6));
			}
			
			for (agentGenerator a1 : a_gen)
			{
				for (agentGenerator a2: a_gen)
				{
					if (a1 != a2)
					{
						if ((a2.position.y >= a1.position.y - Main.global_var.agent_personal_space) && (a2.position.y <= a1.position.y + Main.global_var.agent_personal_space))
						{
							overlap = true;
						}
					}
				}
			}
		}while (overlap == true);
		
		
	}
}
