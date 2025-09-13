package Activation_getCheckingValue;

import java.util.ArrayList;

import Action.SpaceReference_Expand;
import agents.Agent;
import agents.FOV_segment;
import agents.FOV_segment_dataStructure;
import behavior.Behavior;
import core.Main;
import entities.Entity;
import filters.Filter;
import filters.Filter_method;
import filters.Filter_ranged;
import obstacles.Obstacle;
import obstacles.Obstacle_rectangle;

public class NeighborChecking_Value extends Activation_CheckingValue
{

	public ArrayList<Filter> filter_chain = new ArrayList<Filter>();
		
	public boolean null_activation = true;
	

	public NeighborChecking_Value(double property, ArrayList<Filter> filter_c, boolean null_c) 
	{
		
		super(property);
		this.filter_chain = filter_c;
		this.null_activation = null_c;
		
	
	}

	public double getNeighborCheckingValue(Agent target_agent,ArrayList<Entity> neighbor, int timestep)
	{
		double checking_value = 0;
		
		ArrayList<Entity> return_entity = Main.utility.getFilteredAgents(this.filter_chain, target_agent, neighbor, timestep);
				
		Entity chosen_entity = null;
		
		if (return_entity.size() == 0)
		{
			//This is where null activation will kick in or not
			//if null activtion is true, it will return a weight in Activation.java
			checking_value = Double.NaN;
			
		}
		// If there is one entity only in the return set
		else if (return_entity.size() == 1)
		{
			chosen_entity = return_entity.get(0);
			
		}
		//If at the end, filter cannot choose 1 agent, the nearest one will be chosen.
		else
		{
			
			if (return_entity.get(0) instanceof Obstacle_rectangle && return_entity.get(1) instanceof Obstacle_rectangle)
			{
				//System.out.println("Check");
			}
			
			Filter_method f = new Filter_method(1,1);
			chosen_entity = f.combination_filter(target_agent, return_entity, timestep);
			
			if (chosen_entity == null)
			{
				//System.out.println("Check");
			}
		}
		
		if (chosen_entity == null)
		{
			//System.out.println("Check");
		}
		
		//An empty filter
		Filter_ranged f = new Filter_ranged(0);
		
		
		//The only case where chosen_entity can be null at this point is 
		//because return_entity has all rectangle obstacle
		//And none of them is in the middle segment
		//Meaning that the direction of the agent will not collide with any rectangle obstacle.
		
		if (chosen_entity == null)
		{
			
			checking_value = Double.NaN;
		}
		else if (this.extracted_p == 1.1 || this.extracted_p == 1.2)
		{
			checking_value = getNeighborCheckingValueforSpaceDistance(target_agent, neighbor, timestep);
		}
		else
		{
			checking_value = Main.utility.getCheckingValue(this.extracted_p, target_agent, chosen_entity, timestep);
			
		}
		
		
		return checking_value;
	}
	
	//
	public double getNeighborCheckingValueforSpaceDistance(Agent target_agent,ArrayList<Entity> neighbor, int timestep)
	{
		int reference_direction = 0;
		
		//Distance from current direction to an entity
		if(extracted_p == 1.1)
		{
			reference_direction = target_agent.heading.value;
		}
		//Distance from desired direction to an entity
		else if (extracted_p == 1.2)
		{
			reference_direction = 1;
		}
		else
		{
			System.out.println("Should not access this point. NeighborCheckValue.java");
		}
		
		//Just a dummy space reference action to get method in there
		SpaceReference_Expand dummy_action = new SpaceReference_Expand();

		ArrayList<FOV_segment_dataStructure> FOV_segment_dataStruct_list = dummy_action.getSegmentWithoutOverlap(neighbor, Main.obstacles, target_agent);

		for (FOV_segment_dataStructure fsd : FOV_segment_dataStruct_list)
		{
			ArrayList<FOV_segment> temp_seg = new ArrayList<FOV_segment>();

			for (FOV_segment f : fsd.FOV_segment_list)
			{
				//Segment is irregular (in forth and first quarter)
				if (f.range_start > f.range_end)
				{
					if ((reference_direction >= f.range_start && reference_direction <= 360)
							|| (reference_direction >= 1 && reference_direction <= f.range_end)
							)
					{
						//System.out.println("Distance from space: " + fsd.radius);
						return fsd.radius;
					}

				}
				//Segment is regular
				else
				{
					if (reference_direction >= f.range_start && reference_direction <= f.range_end)
					{
						//System.out.println("Distance from space: " + fsd.radius);
						return fsd.radius;
					}
				}
			}
		}
		
		//If should only return 0 if the reference_direction is in an occupied space and next to another entity
		return 0;
	}
}
