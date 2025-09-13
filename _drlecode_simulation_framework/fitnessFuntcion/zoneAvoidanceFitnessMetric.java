package fitnessFuntcion;

import java.util.ArrayList;

import Utility.GlobalVariable;
import agents.Agent;
import agents.Position;
import zones.Zone;
import zones.Zone_rectangle;

public class zoneAvoidanceFitnessMetric 
{
	int fitnessScore = 0;
	
	ArrayList<Agent> agents;
	ArrayList<Zone> zones ;
	
	public GlobalVariable global_var = new GlobalVariable();

	public zoneAvoidanceFitnessMetric(ArrayList<Agent> agents,ArrayList<Zone> zones)
	{
		this.agents = agents;
		this.zones = zones;
	}
	
	//Count how many agents are inside obstacle boundary
	public int fitnessScore(int timesteps)
	{	
		for (Agent a : agents)
		{
			Position p = null;
			
			if (global_var.search_Model == false)
			{
				p = a.pos_history.get(timesteps);
			}
			else
			{
				p = a.position;
			}
			
			for (Zone z : zones)
			{
				if (z instanceof Zone_rectangle)
				{
					Zone_rectangle z_rec = (Zone_rectangle) z;
					//a position is inside z zone
					if (p.x >= z_rec.pos1.x && p.x <= z_rec.pos2.x && p.y >= z_rec.pos1.y && p.y <= z_rec.pos4.y)
					{
						fitnessScore += 1;
					}
				}
				
			}
		}
		
		return this.fitnessScore;
	}
}
