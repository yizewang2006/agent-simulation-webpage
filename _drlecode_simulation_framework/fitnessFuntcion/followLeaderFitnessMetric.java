package fitnessFuntcion;

import java.util.ArrayList;

import Goal.*;
import Utility.GlobalVariable;
import Utility.ReturnVar;
import agents.Agent;
import agents.Position;
import core.Main;

public class followLeaderFitnessMetric 
{
	int fitnessScore = 0;
	int personalSpace = 10;
	
	ArrayList<Agent> agents;
	ArrayList<Goal> goals;
	
	public GlobalVariable global_var = new GlobalVariable();
	public ReturnVar return_var = new ReturnVar();
	
	public followLeaderFitnessMetric(ArrayList<Agent> agents, ArrayList<Goal> g)
	{
		this.agents = agents;
		this.goals = g;
	}
	
	//Count how many agents are inside obstacle boundary
	public int fitnessScore(int timesteps)
	{
		
		for (Agent a: agents)
		{	
			double min_distance_to_leader = Double.MAX_VALUE;
			
			//Assuming there is only one goal point here
			for (Goal g: goals)
			{
				if (g instanceof Goal_point)
				{
					Goal_point g_p = (Goal_point) g;
					
					//Find no_warp_distance first
					double distance_no_warp = a.position.getDistanceBetween2Position(a.position, g_p.position);
					
					//Find warp_distance
					Position goal_point_warp = g_p.position.getWarpPosition(a.position, g_p.position);
					
					if (goal_point_warp.x == 0 && goal_point_warp.y == 0)
					{
						//meaning both target_agent and the goal_point are in the same quarter (TOP-L. TOP-R, BOTTOM-L, BOTTOM-R)
						if (distance_no_warp < min_distance_to_leader)
						{
							min_distance_to_leader = distance_no_warp;
						}
							
						//fitnessScore+= distance_no_warp;
						
					}
					else
					{
						double distance_warp = a.position.getDistanceBetween2Position(a.position, goal_point_warp);
						
						//Head to direction with smaller distance
						if (distance_no_warp <= distance_warp)
						{
							if (distance_no_warp < min_distance_to_leader)
							{
								min_distance_to_leader = distance_no_warp;
							}
							
							//fitnessScore+= distance_no_warp;
						}
						else
						{
							if (distance_warp < min_distance_to_leader)
							{
								min_distance_to_leader = distance_warp;
							}
							
							//fitnessScore+= distance_warp;
						}
					}
					
					
				}
			}
			
			fitnessScore += min_distance_to_leader;
		}
		
		//Average distance from all agents to the goal point.
		fitnessScore = fitnessScore/Main.global_var.num_of_agents;
		
		return fitnessScore;
	}
}


