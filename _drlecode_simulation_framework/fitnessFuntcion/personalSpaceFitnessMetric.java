package fitnessFuntcion;

import java.util.ArrayList;

import Goal.Goal;
import Goal.Goal_point;
import Utility.GlobalVariable;
import Utility.ReturnVar;
import agents.Agent;
import agents.Position;

public class personalSpaceFitnessMetric 
{
	int fitnessScore = 0;
	int personalSpace = 10;
	
	ArrayList<Agent> agents;
	ArrayList<Goal> goals;
	
	public GlobalVariable global_var = new GlobalVariable();
	public ReturnVar return_var = new ReturnVar();
	
	public personalSpaceFitnessMetric(ArrayList<Agent> agents, ArrayList<Goal> goals)
	{
		this.agents = agents;
		this.goals = goals;
	}
	
	//Count how many agents are inside obstacle boundary
	public int fitnessScore(int timesteps)
	{
				
			for (Agent a1 : agents)
			{
				//Check personal space with other agents
				for (Agent a2 : agents)
				{
					if (a1 != a2)
					{
						Position agentA_pos, agentB_pos;

						agentA_pos = a1.position;
						agentB_pos = a2.position;
											
						double temp_x = agentA_pos.x - agentB_pos.x;
						double temp_y = agentA_pos.y - agentB_pos.y;
						
						double dis = Math.sqrt(Math.pow((temp_x),2) + Math.pow(temp_y,2));
						
						if (dis < personalSpace)
						{
							fitnessScore++;

						}
					}
					
				}
				
				
				//Check personal space for goals
				for (Goal g : goals)
				{
					if (g instanceof Goal_point)
					{
						Goal_point gp = (Goal_point) g;
						
						Position agentA_pos, goal_point_pos;
						
						agentA_pos = a1.position;
						goal_point_pos = gp.position;
						
						double temp_x = agentA_pos.x - goal_point_pos.x;
						double temp_y = agentA_pos.y - goal_point_pos.y;
						
						double dis = Math.sqrt(Math.pow((temp_x),2) + Math.pow(temp_y,2));
						
						//If agents are within a range from the leader -> add a big penalty
						if (dis < personalSpace + 15)
						{
							//fitnessScore += 100;
						}
					}
					
					
				}
				
			}
			

		return fitnessScore;
	}
}


