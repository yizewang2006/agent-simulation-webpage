package fitnessFuntcion;

import java.util.ArrayList;

import Utility.GlobalVariable;
import Utility.ReturnVar;
import agents.Agent;
import agents.Position;
import core.Main;
import obstacles.Obstacle;
import obstacles.Obstacle_circle;
import obstacles.Obstacle_rectangle;

public class obstacleAvoidanceFitnessMetric 
{
	
	int fitnessScore = 0;
	ArrayList<Agent> agents;
	ArrayList<Obstacle> obstacles;
	
	public GlobalVariable global_var = new GlobalVariable();
	public ReturnVar return_var = new ReturnVar();
	
	public obstacleAvoidanceFitnessMetric(ArrayList<Agent> agents_add, ArrayList<Obstacle> obstacles_add)
	{
		this.agents = agents_add;
		this.obstacles = obstacles_add;
	}
	
	//Count how many agents are inside obstacle boundary
	public int fitnessScore(int timesteps)
	{
		for (Obstacle o : obstacles)
		{
			if (o instanceof Obstacle_rectangle)
			{
				Obstacle_rectangle or = (Obstacle_rectangle) o;
				for (Agent a: agents)
				{
					Position p = getPosition(a, timesteps);
					
					//If a position is inside rectangle obstacle
					if (p.x >= or.pos1.x && p.x <= or.pos2.x && p.y >= or.pos1.y && p.y <= or.pos4.y)
					{
						fitnessScore += 1;
					}
				}
			}
			else if (o instanceof Obstacle_circle)
			{
				Obstacle_circle oc = (Obstacle_circle) o;
				
				for (Agent a: agents)
				{
					Position p = getPosition(a, timesteps);
					
					double temp_x  = 0;
					double temp_y  = 0;
					
					double dis = a.position.getDistanceBetween2Position(a.position, oc.pos);
					
					//Current agent is inside current obstacle boundary
					if (dis <= oc.radius)
					{
						fitnessScore += 1;
					}
					
				}
			}
		}
		
		return this.fitnessScore;
	}
	
	public Position getPosition(Agent a, int timesteps)
	{

		return a.position;
	}
}


