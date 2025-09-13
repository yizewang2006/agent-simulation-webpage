package fitnessFuntcion;

import java.util.ArrayList;
import Utility.GlobalVariable;
import Utility.ReturnVar;
import agents.Agent;
import agents.Position;

public class speedFitnessMetric
{
	int fitnessScore = 0;
	int personalSpace = 10;
	
	ArrayList<Agent> agents;
	
	public GlobalVariable global_var = new GlobalVariable();
	public ReturnVar return_var = new ReturnVar();
	
	public speedFitnessMetric(ArrayList<Agent> agents)
	{
		this.agents = agents;

	}
	
	//Count how many agents not move at the end of simulation
	public int fitnessScore(int timesteps)
	{
		for (int i = 0; i < agents.size(); i++)
		{
			if (agents.get(i).speed.value <= 0.01 && agents.get(i).speed.value >= -0.01)
			{
				fitnessScore++;
			}
		}
		return fitnessScore;
	}
}


