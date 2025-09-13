package fitnessFuntcion;

import java.util.ArrayList;

import Utility.GlobalVariable;
import agents.Agent;
import agents.Position;
import zones.Zone;

public class insideDestinationZone 
{
	int fitnessScore = 0;
	
	ArrayList<Agent> agents;
	ArrayList<Zone> zones ;
	
	public GlobalVariable global_var = new GlobalVariable();

	public insideDestinationZone(ArrayList<Agent> agents,ArrayList<Zone> zones)
	{
		this.agents = agents;
		this.zones = zones;
	}
	
	//Count how many agents are inside obstacle boundary
	public int fitnessScore(int timesteps)
	{	
		for (Agent a : agents)
		{
			Position p;
			
			if (global_var.search_Model == false)
			{
				p = a.pos_history.get(timesteps);
			}
			else
			{
				p = a.position;
			}
			
			
			//a position is NOT inside z zone and NOT have the wanted types
			//agent type 1 should be in zone 3
			if (a.type.value == 1.0)
			{
				if ((p.x >= 1050 && p.x <= 1550 && p.y >= 50 && p.y <= 130) == false)
				{
					fitnessScore++;
				}
			}
			
			//agent type 1.1 should be in zone 1
			if (a.type.value == 1.1)
			{
				if ((p.x >= 50 && p.x <= 550 && p.y >= 50 && p.y <= 130) == false)
				{
					fitnessScore++;
				}
			}
			
			
		}
		return this.fitnessScore;
	}
}
