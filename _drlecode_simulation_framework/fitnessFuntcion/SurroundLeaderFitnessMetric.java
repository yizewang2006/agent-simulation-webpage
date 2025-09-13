package fitnessFuntcion;

import java.util.ArrayList;

import Goal.Goal;
import Goal.Goal_point;
import Utility.GlobalVariable;
import agents.Agent;
import agents.Position;
import core.Main;

public class SurroundLeaderFitnessMetric 
{
	double fitnessScore = 0;

	ArrayList<Agent> agents;
	ArrayList<Goal_point> goal_points = new ArrayList<Goal_point>();
	
	ArrayList<checkingSurround_DataStruct> checking_surround = new ArrayList<checkingSurround_DataStruct>();
	double distance_l = 0;
	double distance_u = 0;
	int interval = 45;
	
	public SurroundLeaderFitnessMetric(ArrayList<Agent> agents, ArrayList<Goal> goal_point, double l, double u)
	{
		
		this.distance_l = l;
		this.distance_u = u;
		this.agents = agents;
		
		for (Goal p : goal_point)
		{
			if (p instanceof Goal_point)
			{
				this.goal_points.add((Goal_point) p);
			}
		}
		
		

		
		for (int i = 0; i< 359;)
		{
			if (i + interval >= 360)
			{
				checkingSurround_DataStruct new_data = new checkingSurround_DataStruct(i, 359);
				checking_surround.add(new_data);
			}
			else
			{
				checkingSurround_DataStruct new_data = new checkingSurround_DataStruct(i, i + interval);
				checking_surround.add(new_data);
			}
			
			
			
			i += interval;
		}
		
	}


	public double fitnessScore(int timesteps)
	{
		int number_of_agent_surround_leader = 0;
		for (Agent a : agents)
		{
			//For now, there is only one leader
			for (Goal_point p: goal_points)
			{
				int heading_from_a_to_l = a.position.convertFromPositionToAngle(p.position, a.position);
				double distance_from_a_to_l = a.position.getDistanceBetween2Position(a.position, p.position);
				
				if (distance_from_a_to_l >= distance_l && distance_from_a_to_l <= distance_u)
				{
					
					number_of_agent_surround_leader++;
					
					for (checkingSurround_DataStruct cd : checking_surround)
					{
						if (cd.upperR != 359)
						{
							//Inside the range -> give a check in this interval
							if (heading_from_a_to_l >= cd.lowerR && heading_from_a_to_l < cd.upperR)
							{
							
								if (cd.cover == false)
								{
									cd.cover = true;
								}
							}
						}
						else
						{
							if (heading_from_a_to_l >= cd.lowerR && heading_from_a_to_l <= 359)
							{
								if (cd.cover == false)
								{
									cd.cover = true;
								}
							}
						}
					}
				}
				
			}
		}
		
		double count_cover = 0;
		
		//The number of agent surround the leader must greater than a threshold
		if (number_of_agent_surround_leader < Main.global_var.num_of_agents*0.8)
		{
			return 0;
		}
		else
		{
			for (checkingSurround_DataStruct cd : checking_surround)
			{
				if (cd.cover == true)
				{
					count_cover++;
				}
			}
				
			this.fitnessScore = count_cover/((360/interval));
					
			return this.fitnessScore;
		}
		

	}
}

class checkingSurround_DataStruct
{
	
	boolean cover = false;
	int lowerR = 0;
	int upperR = 0;
	
	public checkingSurround_DataStruct(int l, int u)
	{
		this.lowerR = l;
		this.upperR = u;
	}
}
