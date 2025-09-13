package Activation_getCheckingValue;

import java.util.ArrayList;

import Action.SpaceReference_Expand;
import Action.SpaceReference_Static;
import Goal.Goal;
import agents.Agent;
import entities.Entity;
import filters.Filter;
import obstacles.Obstacle;

public class SpaceChecking_Value  extends Activation_CheckingValue
{
	
	public boolean null_activation = true;
	
	//SpaceChecking_Value here is special because the process of finding the checking value for activation is identical to
	//action part, instead of re implement the whole thing, I re used the code here
	public SpaceReference_Expand action_for_activation;
	public SpaceReference_Static action_for_activation_static;
	
	public SpaceChecking_Value(double property, SpaceReference_Expand space_act, boolean null_c) 
	{
		
		super(property);
		this.action_for_activation = space_act;
		this.null_activation = null_c;
		
	}
	
	
	public SpaceChecking_Value(double property, SpaceReference_Static space_act, boolean null_c) 
	{
		
		super(property);
		this.action_for_activation_static = space_act;
		this.null_activation = null_c;
		
	}
	
	//extract property 
	//1 -> desired
	//2 -> travel distance
	//3 -> current direction
	public double getSpaceCheckingValue(Agent target_agent,ArrayList<Entity> neighbor, ArrayList<Obstacle> obstacles, ArrayList<Goal> goals, int timestep)
	{
		if (this.action_for_activation_static instanceof SpaceReference_Static)
		{
			//Reset the sensing
			for (Entity e: neighbor)
			{
				e.sense = false;
			}
			
			return action_for_activation_static.getReferenceValue(neighbor, obstacles, goals, target_agent, false);
		}
		else
		{
			System.out.println("Action in SpaceChecking_Value is not Spacereference_Expand");
		}
		
		return 0;
	}
}
